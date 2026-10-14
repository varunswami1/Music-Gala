#!/usr/bin/env python3
"""Build public/data/recommendations.json: for each seed song, similar songs from OUTSIDE your library, each with a reason.

Source: Last.fm track.getSimilar (free key: last.fm/api). The key stays on your machine; the app only reads the finished JSON.
The app marks which suggestions are already in your library (inLibrary), so this file may list them too.

Usage:  set LASTFM_API_KEY=...            (PowerShell: $env:LASTFM_API_KEY="...")
        python scripts/build_recs.py public/data/library.json --limit 30      # 30 seeds: favourites with covers first
        python scripts/build_recs.py public/data/library.json --all           # every song (slow: about 1 request per second)
Safe to stop (Ctrl+C) and resume: answers are cached in pipeline/out/recs_cache.json. Needs internet.
Offline tests:  python -m unittest scripts/test_scripts.py -v
"""
import argparse, json, os, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import ROOT, Cache, Throttle, get_json, load_library, norm  # noqa: E402

UA = f"MusicGalleryRecs/0.1 ({os.environ.get('CONTACT', 'personal project')})"
API = "https://ws.audioscrobbler.com/2.0/"


def parse_similar(resp, seed_title, per_seed=15):
    """Last.fm track.getSimilar response -> list of {title, artist, reason, source}. Tolerates missing or odd shapes."""
    items = ((resp or {}).get("similartracks") or {}).get("track") or []
    if isinstance(items, dict):
        items = [items]
    out = []
    for t in items:
        title = (t.get("name") or "").strip()
        artist = ((t.get("artist") or {}).get("name") or "").strip()
        if not title or not artist:
            continue
        try:
            match = float(t.get("match"))
            why = f"Listeners of “{seed_title}” also play this (Last.fm match {match:.2f})"
        except (TypeError, ValueError):
            why = f"Listeners of “{seed_title}” also play this"
        out.append({"title": title, "artist": artist, "reason": why, "source": "Last.fm similar tracks"})
        if len(out) >= per_seed:
            break
    return out


def pick_seeds(lib, limit, everything):
    songs = [t for t in lib["tracks"] if t.get("artistNames")]
    songs.sort(key=lambda t: (not t.get("isFavourite"), not t.get("coverUrl")))
    return songs if everything else songs[:limit]


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("library"); ap.add_argument("--limit", type=int, default=30); ap.add_argument("--all", action="store_true")
    ap.add_argument("--out", default=str(ROOT / "public/data/recommendations.json"))
    args = ap.parse_args(argv)
    key = os.environ.get("LASTFM_API_KEY")
    if not key:
        sys.exit("Set LASTFM_API_KEY first (free at last.fm/api).")

    lib = load_library(args.library)
    seeds = pick_seeds(lib, args.limit, args.all)
    cache = Cache(ROOT / "pipeline/out/recs_cache.json")
    throttle = Throttle(0.3)                                                  # Last.fm allows a few requests per second; stay well below
    result, failed = {}, 0
    try:
        for i, s in enumerate(seeds, 1):
            ck = f"{norm(s['artistNames'][0])}|{norm(s['title'])}"
            if not cache.has(ck):
                resp = get_json(API, {"method": "track.getsimilar", "artist": s["artistNames"][0], "track": s["title"],
                                      "autocorrect": 1, "limit": 30, "api_key": key, "format": "json"}, throttle, UA)
                if resp is None:
                    failed += 1; print(f"[{i}/{len(seeds)}] network problem, will retry next run: {s['title']}"); continue
                if "error" in resp:                                           # e.g. track not found: a real answer, cache it as empty
                    cache.set(ck, [])
                else:
                    cache.set(ck, parse_similar(resp, s["title"]))
            if cache.get(ck):
                result[s["id"]] = cache.get(ck)
            if i % 25 == 0:
                print(f"[{i}/{len(seeds)}] seeds with suggestions: {len(result)}")
    except KeyboardInterrupt:
        print("stopped; progress is cached")
    finally:
        cache.save()
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    prev = {}
    if Path(args.out).exists():                                            # keep byArtist/related from build_recs_from_profiles.py
        try: prev = json.loads(Path(args.out).read_text(encoding="utf-8"))
        except Exception: prev = {}
    Path(args.out).write_text(json.dumps({"byArtist": prev.get("byArtist", {}), "related": prev.get("related", {}), "bySong": result}, ensure_ascii=False), encoding="utf-8")
    print(f"wrote {args.out}: {len(result)} of {len(seeds)} seeds have suggestions, {failed} to retry")


if __name__ == "__main__":
    main()
