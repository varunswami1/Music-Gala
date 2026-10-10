#!/usr/bin/env python3
"""Download cover images into public/covers/ and point library.json at the local copies.

Why: remote covers can be blocked inside the 3D canvas (CORS) and are slow. Local files are fast and always work.
Usage:  python scripts/localize_covers.py public/data/library.json
Safe to re-run: existing files are skipped. Writes library.local.json next to the input (use it as library.json).
Checks: a download counts only if it is a real image (JPEG/PNG/WebP header, not an HTML error page). Failures are listed at the end and retried on the next run.
Optional: if Pillow is installed (pip install pillow) each song also gets `dominantColor` (e.g. "#a3552c"), which the Song Room can use to tint the room.
Standard library only otherwise.
"""
import json, sys, time, urllib.request
from pathlib import Path

try:
    from PIL import Image
except ImportError:
    Image = None

ROOT = Path(__file__).resolve().parent.parent
MAGIC = (b"\xff\xd8\xff", b"\x89PNG", b"RIFF")    # JPEG, PNG, WebP (RIFF container)


def is_image(data):
    return len(data) > 500 and data.startswith(MAGIC)


def dominant_color(path):
    """Average colour of the most colourful part of the cover, as #rrggbb. None when Pillow is missing or the file is unreadable."""
    if Image is None:
        return None
    try:
        im = Image.open(path).convert("RGB").resize((32, 32))
        px = list(im.getdata())
        # weight by saturation so a mostly white or black cover still gives its actual colour
        w = [max(0.05, (max(p) - min(p)) / 255) for p in px]
        t = sum(w)
        r, g, b = (int(sum(p[i] * wi for p, wi in zip(px, w)) / t) for i in range(3))
        return f"#{r:02x}{g:02x}{b:02x}"
    except Exception:
        return None


def fetch(url):
    for attempt in range(2):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "MusicGallery/0.2 (personal project)"})
            data = urllib.request.urlopen(req, timeout=30).read()
            if is_image(data):
                return data
        except Exception:
            pass
        time.sleep(1 + attempt)
    return None


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    src = Path(sys.argv[1])
    out_dir = ROOT / "public/covers"; out_dir.mkdir(parents=True, exist_ok=True)
    lib = json.loads(src.read_text(encoding="utf-8"))
    done = skipped = colored = 0
    failed = []
    for t in lib["tracks"]:
        url = t.get("coverUrl")
        if not url:
            continue
        dest = out_dir / f"{t['id']}.jpg"
        if not url.startswith("/covers/"):
            if not dest.exists():
                data = fetch(url)
                if data is None:
                    failed.append((t["id"], url)); continue
                dest.write_bytes(data); time.sleep(0.1)
            t["coverUrl"] = f"/covers/{dest.name}"; done += 1
        else:
            skipped += 1
        if dest.exists() and not t.get("dominantColor"):
            c = dominant_color(dest)
            if c:
                t["dominantColor"] = c; colored += 1
    out = src.with_name("library.local.json")
    out.write_text(json.dumps(lib, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"localised {done} covers ({skipped} were already local), {len(failed)} failed, {colored} dominant colours added -> {out}")
    if Image is None:
        print("note: Pillow not installed, so no dominantColor was added (pip install pillow)")
    for tid, url in failed[:20]:
        print("  failed", tid, url)
    if failed:
        print("failed songs keep their remote coverUrl in the output; re-run to retry them")


if __name__ == "__main__":
    main()
