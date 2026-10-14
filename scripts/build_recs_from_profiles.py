#!/usr/bin/env python3
"""Build public/data/recommendations.json OFFLINE from the artist profiles you already have (artists.json from YouTube Music).

No internet and no API key needed. For every artist that has a profile it uses:
  topSongs        -> songs by that artist that are NOT in your library              ("a top song by X you don't have yet")
  relatedArtists  -> (a) songs by related artists that have a profile, not in your library   ("by R, related to X")
                     (b) related artists you have NOT heard at all, as artist suggestions
                     (c) related artists that ARE in your library, so the app can rank their songs higher in "From library"
Only artists with a profile get suggestions (the supplied artists.json has about 100). Add more profiles and re-run to widen it.

Usage:  python scripts/build_recs_from_profiles.py public/data/library.json /path/to/artists.json
Output shape: {"byArtist": {libraryArtistId: [rec,...]}, "related": {libraryArtistId: [libraryArtistId,...]}, "bySong": {}}
Offline tests:  python -m unittest scripts/test_scripts.py -v
"""
import json, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import ROOT, load_library, norm  # noqa: E402

MAX_PER_ARTIST = 14
SRC = "YouTube Music profile data"


def song_rec(title, artist, video_id, reason):
    return {"title": title, "artist": artist, "reason": reason, "youtubeId": video_id, "coverUrl": None, "source": SRC, "kind": "song"}


def build(lib, profiles):
    """lib: library dict. profiles: {name: profile} as in artists.json. Returns the recommendations dict."""
    ok = {norm(k): p for k, p in profiles.items() if isinstance(p, dict) and not p.get("miss")}
    lib_artist = {norm(a["name"]): a for a in lib["artists"]}
    owned_yt = {t["youtubeId"] for t in lib["tracks"] if t.get("youtubeId")}
    owned_key = {(norm(t["title"]), norm(t["artistNames"][0])) for t in lib["tracks"] if t.get("artistNames")}

    def have(title, artist, vid):
        return (vid in owned_yt) or ((norm(title), norm(artist)) in owned_key)

    by_artist, related = {}, {}
    for name_n, p in ok.items():
        me = lib_artist.get(name_n)
        if not me:
            continue                                                     # profiled artist is not in the library: no seed songs to attach to
        pname = p.get("name") or me["name"]
        recs, seen = [], set()

        def add(r):
            k = (norm(r["title"]), norm(r["artist"]))
            if k not in seen:
                seen.add(k); recs.append(r)

        # (a1) their own top songs you don't have
        for s in (p.get("topSongs") or [])[:6]:
            if s.get("title") and not have(s["title"], pname, s.get("videoId")):
                add(song_rec(s["title"], pname, s.get("videoId"), f"A top song by {pname} that you don't have yet"))
        # (a2) top songs of related artists (round robin, so one artist does not fill the list)
        rel = p.get("relatedArtists") or []
        pools = []
        rel_in_lib = []
        for r in rel:
            rn = norm(r.get("name", ""))
            if rn in lib_artist and rn != name_n:
                rel_in_lib.append(lib_artist[rn]["id"])
            rp = ok.get(rn)
            if rp:
                rname = rp.get("name") or r["name"]
                pools.append([song_rec(s["title"], rname, s.get("videoId"), f"By {rname}, an artist related to {pname}")
                              for s in (rp.get("topSongs") or [])[:4] if s.get("title") and not have(s["title"], rname, s.get("videoId"))])
        for i in range(4):
            for pool in pools:
                if i < len(pool):
                    add(pool[i])
        # (b) related artists you have not heard (no song known): artist-level suggestion
        for r in rel:
            rn = norm(r.get("name", ""))
            if rn and rn not in lib_artist and rn not in ok:
                add({"title": r["name"], "artist": "Artist", "reason": f"Related to {pname}, not in your library", "youtubeId": None, "coverUrl": None, "source": SRC, "kind": "artist"})
        if recs:
            by_artist[me["id"]] = recs[:MAX_PER_ARTIST]
        if rel_in_lib:
            related[me["id"]] = rel_in_lib
    return {"byArtist": by_artist, "related": related, "bySong": {}}


def main(argv=None):
    argv = argv if argv is not None else sys.argv[1:]
    if len(argv) < 2:
        sys.exit(__doc__)
    lib = load_library(argv[0]); profiles = json.loads(Path(argv[1]).read_text(encoding="utf-8"))
    out = build(lib, profiles)
    path = ROOT / "public/data/recommendations.json"
    # keep any Last.fm results (bySong) from build_recs.py
    if path.exists():
        try: out["bySong"] = json.loads(path.read_text(encoding="utf-8")).get("bySong", {})
        except Exception: pass
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(out, ensure_ascii=False), encoding="utf-8")
    songs_covered = sum(1 for t in lib["tracks"] if any(a in out["byArtist"] for a in t.get("artistIds", [])))
    print(f"wrote {path}: suggestions for {len(out['byArtist'])} artists (covers {songs_covered} of {len(lib['tracks'])} songs), "
          f"{sum(len(v) for v in out['byArtist'].values())} suggestions, related-in-library links for {len(out['related'])} artists")


if __name__ == "__main__":
    main()
