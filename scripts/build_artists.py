#!/usr/bin/env python3
"""Build public/data/artists.json (bios, portraits, origin, genres, active years) for every artist in library.json.

Sources (public metadata, personal project; check each site's terms before any public release):
  MusicBrainz  artist match, country/area, active years, genres     https://musicbrainz.org  (data CC0)
  Wikidata     link from the MusicBrainz artist to the Wikipedia page
  Wikipedia    short biography and portrait thumbnail               text is CC BY-SA 4.0: credit is stored in bioSource and shown in the app

Honesty rules: an artist is accepted only on an exact normalised-name match with MusicBrainz score >= 95 AND a Wikipedia page
whose description looks like a music act. Otherwise the fields stay empty. Nothing is guessed or written by an LLM.

Usage:  python scripts/build_artists.py public/data/library.json --limit 20     # small trial first
        python scripts/build_artists.py public/data/library.json               # all artists; safe to stop (Ctrl+C) and resume
        add --portraits to also download thumbnails into public/artists/ (imageUrl then points at /artists/<id>.jpg)
Needs internet. Polite to the APIs: 1 request per second, descriptive User-Agent.  Set CONTACT=you@example.com to put your address in it.
Offline tests:  python -m unittest scripts/test_scripts.py -v
"""
import argparse, json, os, re, sys, urllib.parse, urllib.request
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import ROOT, Cache, Throttle, get_json, load_library, norm  # noqa: E402

UA = f"MusicGalleryArtists/0.1 ({os.environ.get('CONTACT', 'personal project')})"
MB = "https://musicbrainz.org/ws/2"
MUSICISH = re.compile(r"singer|rapper|musician|band|composer|producer|disc jockey|\bdj\b|vocalist|songwriter|duo|group|artist|music", re.I)


def pick_mb_match(name, search_json):
    """Exact normalised-name match with a high score; ties go to the first (highest score) result."""
    for a in (search_json or {}).get("artists", []):
        if a.get("score", 0) >= 95 and norm(a.get("name", "")) == norm(name):
            return a
    return None


def wikidata_id(mb_artist_json):
    for rel in (mb_artist_json or {}).get("relations", []):
        if rel.get("type") == "wikidata":
            m = re.search(r"/(Q\d+)$", (rel.get("url") or {}).get("resource", ""))
            if m:
                return m.group(1)
    return None


def enwiki_title(entity_json, qid):
    try:
        return entity_json["entities"][qid]["sitelinks"]["enwiki"]["title"]
    except (KeyError, TypeError):
        return None


def active_years(mb_artist_json):
    ls = (mb_artist_json or {}).get("life-span") or {}
    begin = (ls.get("begin") or "")[:4]
    end = (ls.get("end") or "")[:4]
    if not begin:
        return None
    return f"{begin}–{end}" if end else f"{begin}–present"


def origin_of(mb_artist_json):
    a = mb_artist_json or {}
    area = (a.get("area") or {}).get("name")
    begin = (a.get("begin-area") or {}).get("name")
    return begin or area or None


def top_genres(mb_artist_json, n=4):
    gs = sorted((mb_artist_json or {}).get("genres", []), key=lambda g: -g.get("count", 0))
    return [g["name"] for g in gs[:n] if g.get("name")]


def parse_summary(summary_json):
    """Returns (bio, thumbnail_url) or (None, None) when the page is missing, a disambiguation page, or not about a music act."""
    s = summary_json or {}
    if s.get("type") != "standard" or not s.get("extract"):
        return None, None
    if not MUSICISH.search((s.get("description") or "") + " " + s["extract"][:300]):
        return None, None
    thumb = (s.get("thumbnail") or {}).get("source")
    return s["extract"].strip(), thumb


def download(url, dest, throttle):
    throttle.wait()
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        data = urllib.request.urlopen(req, timeout=30).read()
        if len(data) < 500:
            return False
        dest.write_bytes(data)
        return True
    except Exception:
        return False


def lookup(name, throttle):
    """One artist -> dict of fields (possibly empty), or None when a network step failed (so it is retried next run)."""
    found = get_json(f"{MB}/artist/", {"query": f'artist:"{name}"', "fmt": "json", "limit": 5}, throttle, UA)
    if found is None:
        return None
    m = pick_mb_match(name, found)
    if not m:
        return {}
    full = get_json(f"{MB}/artist/{m['id']}", {"inc": "url-rels+genres", "fmt": "json"}, throttle, UA)
    if full is None:
        return None
    out = {"mbid": m["id"], "genres": top_genres(full), "origin": origin_of(full), "activeYears": active_years(full)}
    qid = wikidata_id(full)
    if qid:
        ent = get_json(f"https://www.wikidata.org/wiki/Special:EntityData/{qid}.json", None, throttle, UA)
        title = enwiki_title(ent, qid) if ent else None
        if title:
            summ = get_json("https://en.wikipedia.org/api/rest_v1/page/summary/" + urllib.parse.quote(title.replace(" ", "_"), safe=""), None, throttle, UA)
            bio, thumb = parse_summary(summ)
            if bio:
                out.update({"bio": bio, "bioSource": "Wikipedia (CC BY-SA 4.0)", "_thumb": thumb})
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("library"); ap.add_argument("--limit", type=int, default=0); ap.add_argument("--portraits", action="store_true")
    ap.add_argument("--out", default=str(ROOT / "public/data/artists.json"))
    args = ap.parse_args(argv)

    lib = load_library(args.library)
    artists = sorted(lib["artists"], key=lambda a: -a.get("songCount", 0))   # biggest artists first: most visible payoff
    if args.limit:
        artists = artists[: args.limit]
    cache = Cache(ROOT / "pipeline/out/artists_cache.json")
    throttle = Throttle(1.1)                                                  # MusicBrainz asks for at most 1 request per second
    pdir = ROOT / "public/artists"
    if args.portraits:
        pdir.mkdir(parents=True, exist_ok=True)

    result, hit, miss, failed = {}, 0, 0, 0
    try:
        for i, a in enumerate(artists, 1):
            if not cache.has(a["id"]):
                r = lookup(a["name"], throttle)
                if r is None:
                    failed += 1; print(f"[{i}/{len(artists)}] network problem, will retry next run: {a['name']}"); continue
                cache.set(a["id"], r)
            r = dict(cache.get(a["id"]))
            thumb = r.pop("_thumb", None)
            if args.portraits and thumb:
                dest = pdir / f"{a['id']}.jpg"
                if dest.exists() or download(thumb, dest, throttle):
                    r["imageUrl"] = f"/artists/{dest.name}"
            elif thumb:
                r["imageUrl"] = thumb                                        # remote URL; may be blocked in WebGL (CORS). Use --portraits.
            r.pop("mbid", None)
            r = {k: v for k, v in r.items() if v}
            if r:
                result[a["id"]] = r; hit += 1
            else:
                miss += 1
            if i % 25 == 0:
                print(f"[{i}/{len(artists)}] found {hit}, nothing for {miss}")
    except KeyboardInterrupt:
        print("stopped; progress is cached")
    finally:
        cache.save()
    Path(args.out).parent.mkdir(parents=True, exist_ok=True)
    Path(args.out).write_text(json.dumps(result, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"wrote {args.out}: {hit} artists with data, {miss} with nothing found, {failed} to retry")


if __name__ == "__main__":
    main()
