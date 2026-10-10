#!/usr/bin/env python3
"""Import the final data files into the app's formats. Owner: Person 5.

  library_final.json -> public/data/library.json
  artists.json       -> public/data/artists.json     (keyed by NAME in the source; the app wants artist ID. Matched by normalised name.)
  lyrics.json        -> public/data/lyrics/<youtubeId>.json   (keyed by YouTube id in the source; one small file per song so the app never loads 18 MB at once)

Usage:  python scripts/import_data.py --library library_final.json --artists artists.json --lyrics lyrics.json
Any of the three can be left out. Safe to re-run (files are overwritten). Standard library only.
Offline tests:  python -m unittest scripts/test_scripts.py -v
"""
import argparse, json, shutil, sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _common import ROOT, norm  # noqa: E402

CREDIT = "YouTube Music artist profile"


def convert_artists(src, lib_artists):
    """src: {name: profile}. lib_artists: library 'artists' list. Returns {artistId: {bio, bioSource, imageUrl}} (only fields that exist)."""
    by_name = {}
    for key, p in src.items():
        if not isinstance(p, dict) or p.get("miss"):
            continue
        for n in {key, p.get("name"), p.get("queryName")}:
            if n:
                by_name.setdefault(norm(n), p)
    out = {}
    for a in lib_artists:
        p = by_name.get(norm(a["name"]))
        if not p:
            continue
        bio = (p.get("bio") or "").strip()
        rec = {}
        if bio:
            rec["bio"] = bio; rec["bioSource"] = CREDIT
        if p.get("photoUrl"):
            rec["imageUrl"] = p["photoUrl"]
        if rec:
            out[a["id"]] = rec
    return out


def clean_lyrics(text):
    return "\n".join(line.rstrip() for line in (text or "").replace("\r\n", "\n").replace("\r", "\n").split("\n")).strip()


def convert_lyrics(src):
    """src: {youtubeId: {lyrics, source}} -> {youtubeId: {text, source, partial}} for non-empty lyrics only."""
    out = {}
    for vid, v in src.items():
        text = clean_lyrics(v.get("lyrics") if isinstance(v, dict) else None)
        if not text or not vid or "/" in vid or "\\" in vid:
            continue
        src_name = v.get("source")
        out[vid] = {"text": text, "source": src_name if src_name and src_name != "None" else "provided with the project (original source not recorded)", "partial": False}
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--library"); ap.add_argument("--artists"); ap.add_argument("--lyrics")
    args = ap.parse_args(argv)
    data = ROOT / "public/data"; data.mkdir(parents=True, exist_ok=True)
    lib_path = Path(args.library) if args.library else data / "library.json"
    if args.library:
        shutil.copyfile(args.library, data / "library.json"); print("library ->", data / "library.json")
    if args.artists:
        lib = json.loads(lib_path.read_text(encoding="utf-8"))
        out = convert_artists(json.loads(Path(args.artists).read_text(encoding="utf-8")), lib["artists"])
        (data / "artists.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
        print(f"artists -> {len(out)} of {len(lib['artists'])} library artists have a profile")
    if args.lyrics:
        out = convert_lyrics(json.loads(Path(args.lyrics).read_text(encoding="utf-8")))
        d = data / "lyrics"; d.mkdir(exist_ok=True)
        for vid, rec in out.items():
            (d / f"{vid}.json").write_text(json.dumps(rec, ensure_ascii=False), encoding="utf-8")
        print(f"lyrics -> {len(out)} files in {d}")


if __name__ == "__main__":
    main()
