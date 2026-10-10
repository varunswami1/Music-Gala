#!/usr/bin/env python3
"""Apply your hand fixes to the enriched library. No APIs, no re-running anything.

Usage:  python apply_overrides.py out/library.enriched.json song_overrides.csv --output out/library.final.json
song_overrides.csv columns:  id,scene        (optional third column: wing = global or desi, for desi_hiphop)
Allowed scenes: hindi_film, punjabi, desi_hiphop, english, indie_pop, folk_regional, unsorted
"""
import argparse, csv, json, sys
from pathlib import Path
from enrich import SCENE_IDS, recount


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("library"); ap.add_argument("overrides"); ap.add_argument("--output", default="out/library.final.json")
    a = ap.parse_args()
    lib = json.loads(Path(a.library).read_text(encoding="utf-8"))
    by_id = {t["id"]: t for t in lib["tracks"]}
    applied = missing = bad = 0
    for r in csv.DictReader(open(a.overrides, encoding="utf-8-sig")):
        t, scene = by_id.get((r.get("id") or "").strip()), (r.get("scene") or "").strip()
        if t is None:
            missing += 1; print(f"  unknown id: {r.get('id')}", file=sys.stderr); continue
        if scene not in SCENE_IDS + ["unsorted"]:
            bad += 1; print(f"  bad scene '{scene}' for {t['id']}", file=sys.stderr); continue
        t["roomId"] = scene
        wing = (r.get("wing") or "").strip()
        t["wing"] = (wing if wing in ("global", "desi") else (t.get("wing") or "desi")) if scene == "desi_hiphop" else None
        t["confidence"], t["needsReview"], t["classifiedBy"] = 1.0, scene == "unsorted", "manual"
        applied += 1
    recount(lib)
    Path(a.output).write_text(json.dumps(lib, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"applied {applied} | unknown ids {missing} | bad scenes {bad} | written {a.output}")


if __name__ == "__main__":
    main()
