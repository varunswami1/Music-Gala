#!/usr/bin/env python3
"""Check a library.json before it goes into public/data/. Exit code 1 when there are errors.

Usage:  python scripts/validate_library.py public/data/library.json            # report only
        python scripts/validate_library.py public/data/library.json --fix-counts   # also rewrite room/artist counts into <name>.fixed.json

Errors   (the app would misbehave): duplicate ids, track pointing at an unknown room or artist, artist pointing at an unknown room.
Warnings (data is thin):            no cover, no year, no youtubeId, room/artist counts that do not match the tracks, songs needing review.
"""
import argparse, json, sys
from collections import Counter
from pathlib import Path


def validate(lib):
    errors, warnings = [], []
    rooms = {r["id"]: r for r in lib.get("rooms", [])}
    artists = {a["id"]: a for a in lib.get("artists", [])}
    tracks = lib.get("tracks", [])

    for label, items in (("room", lib.get("rooms", [])), ("artist", lib.get("artists", [])), ("track", tracks)):
        dup = [k for k, n in Counter(i["id"] for i in items).items() if n > 1]
        if dup:
            errors.append(f"duplicate {label} ids: {dup[:5]}")
    for a in artists.values():
        if a.get("roomId") not in rooms:
            errors.append(f"artist {a['id']} ({a.get('name')}) has unknown roomId {a.get('roomId')!r}")
    for t in tracks:
        if t.get("roomId") not in rooms:
            errors.append(f"track {t['id']} has unknown roomId {t.get('roomId')!r}")
        for aid in t.get("artistIds", []):
            if aid not in artists:
                errors.append(f"track {t['id']} points at unknown artist {aid}")
        if len(t.get("artistIds", [])) != len(t.get("artistNames", [])):
            warnings.append(f"track {t['id']}: artistIds and artistNames differ in length")

    n = max(len(tracks), 1)
    stats = {
        "tracks": len(tracks), "artists": len(artists),
        "with cover": sum(1 for t in tracks if t.get("coverUrl")),
        "with year": sum(1 for t in tracks if t.get("year")),
        "with youtubeId": sum(1 for t in tracks if t.get("youtubeId")),
        "needs review": sum(1 for t in tracks if t.get("needsReview")),
        "favourites": sum(1 for t in tracks if t.get("isFavourite")),
    }
    for k in ("with cover", "with year", "with youtubeId"):
        if stats[k] < n:
            warnings.append(f"{n - stats[k]} of {n} tracks have no {k.replace('with ', '')} ({100 * stats[k] // n}% covered)")
    if stats["needs review"]:
        warnings.append(f"{stats['needs review']} tracks are flagged needsReview")

    by_room = Counter(t.get("roomId") for t in tracks)
    for rid, r in rooms.items():
        if r.get("kind") != "scene" and rid != "unsorted":
            continue   # favourites/artists/discover/why are views, not rooms with their own tracks
        if r.get("trackCount", 0) != by_room.get(rid, 0):
            warnings.append(f"room {rid}: trackCount says {r.get('trackCount')} but {by_room.get(rid, 0)} tracks point at it")
    by_artist = Counter(aid for t in tracks for aid in t.get("artistIds", []))
    off = sum(1 for aid, a in artists.items() if a.get("songCount", 0) != by_artist.get(aid, 0))
    if off:
        warnings.append(f"{off} artists have a songCount that does not match their tracks")
    return errors, warnings, stats


def fix_counts(lib):
    by_room = Counter(t.get("roomId") for t in lib["tracks"])
    by_artist = Counter(aid for t in lib["tracks"] for aid in t.get("artistIds", []))
    for r in lib["rooms"]:
        r["trackCount"] = by_room.get(r["id"], 0)
    for a in lib["artists"]:
        a["songCount"] = by_artist.get(a["id"], 0)
    return lib


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("library"); ap.add_argument("--fix-counts", action="store_true")
    args = ap.parse_args(argv)
    path = Path(args.library)
    lib = json.loads(path.read_text(encoding="utf-8"))
    errors, warnings, stats = validate(lib)
    print("  ".join(f"{k}: {v}" for k, v in stats.items()))
    for w in warnings:
        print("WARN ", w)
    for e in errors:
        print("ERROR", e)
    if args.fix_counts:
        out = path.with_name(path.stem + ".fixed.json")
        out.write_text(json.dumps(fix_counts(lib), ensure_ascii=False, indent=1), encoding="utf-8")
        print("wrote", out)
    print("OK" if not errors else f"{len(errors)} error(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
