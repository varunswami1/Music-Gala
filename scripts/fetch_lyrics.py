#!/usr/bin/env python3
"""Fetch lyrics from a LICENSED provider (Musixmatch) into public/data/lyrics/<youtubeId>.json. Never scrapes, never invents.

You need your own Musixmatch API key (developer.musixmatch.com). Read their terms: the free plan returns only a PART of each song
and forbids commercial use, so files are marked partial=true and the app says so. If you have a plan that returns full lyrics, pass --full.
The key stays on your machine; the app only reads the finished files.

Usage:  set MUSIXMATCH_API_KEY=...        (PowerShell: $env:MUSIXMATCH_API_KEY="...")
        python scripts/fetch_lyrics.py public/data/library.json --limit 20    # trial: favourites first
        python scripts/fetch_lyrics.py public/data/library.json --all
Safe to re-run: songs that already have a file are skipped; songs with no match are remembered in pipeline/out/lyrics_misses.json.
Offline tests:  python -m unittest scripts/test_scripts.py -v
"""
import argparse, json, os, re, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import ROOT, Cache, Throttle, get_json, load_library  # noqa: E402

UA = f"MusicGalleryLyrics/0.1 ({os.environ.get('CONTACT', 'personal project')})"
API = "https://api.musixmatch.com/ws/1.1/matcher.lyrics.get"
FOOTER = re.compile(r"\n*\*{3,}.*?\*{3,}.*$|\n*\(\d+\)\s*$", re.S)   # the "NOT for Commercial use" notice and the trailing id Musixmatch appends


def parse_lyrics(resp, full):
    """Musixmatch matcher.lyrics.get response -> {text, source, partial} or None when there are no usable lyrics."""
    try:
        status = resp["message"]["header"]["status_code"]
        lyr = resp["message"]["body"]["lyrics"]
    except (KeyError, TypeError):
        return None
    if status != 200 or not isinstance(lyr, dict) or lyr.get("restricted") == 1:
        return None
    text = FOOTER.sub("", lyr.get("lyrics_body") or "").strip()
    if not text:
        return None
    return {"text": text, "source": "Musixmatch", "partial": not full, "copyright": (lyr.get("lyrics_copyright") or "").strip()}


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("library"); ap.add_argument("--limit", type=int, default=20); ap.add_argument("--all", action="store_true")
    ap.add_argument("--full", action="store_true", help="your plan returns complete lyrics (otherwise files are marked partial)")
    args = ap.parse_args(argv)
    key = os.environ.get("MUSIXMATCH_API_KEY")
    if not key:
        sys.exit("Set MUSIXMATCH_API_KEY first (developer.musixmatch.com).")

    lib = load_library(args.library)
    songs = [t for t in lib["tracks"] if t.get("artistNames")]
    songs.sort(key=lambda t: (not t.get("isFavourite"), not t.get("coverUrl")))
    if not args.all:
        songs = songs[: args.limit]
    out_dir = ROOT / "public/data/lyrics"; out_dir.mkdir(parents=True, exist_ok=True)
    misses = Cache(ROOT / "pipeline/out/lyrics_misses.json")
    throttle = Throttle(0.5)
    got = none = failed = 0
    try:
        for i, s in enumerate(songs, 1):
            dest = out_dir / f"{s.get('youtubeId') or s['id']}.json"
            if dest.exists() or misses.has(s["id"]):
                continue
            resp = get_json(API, {"q_track": s["title"], "q_artist": s["artistNames"][0], "apikey": key}, throttle, UA)
            if resp is None:
                failed += 1; continue
            parsed = parse_lyrics(resp, args.full)
            if parsed:
                dest.write_text(json.dumps(parsed, ensure_ascii=False), encoding="utf-8"); got += 1
            else:
                misses.set(s["id"], True); none += 1
            if i % 20 == 0:
                print(f"[{i}/{len(songs)}] saved {got}, no lyrics {none}, to retry {failed}")
    except KeyboardInterrupt:
        print("stopped")
    finally:
        misses.save()
    print(f"done: saved {got}, no lyrics available {none}, to retry {failed}")


if __name__ == "__main__":
    main()
