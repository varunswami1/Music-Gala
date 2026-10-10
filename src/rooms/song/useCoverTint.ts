// Samples a cover image and returns its dominant colour, falling back to `fallback` (the room accent) whenever
// the image is missing, still loading, or cannot be read (remote covers without CORS headers taint the canvas;
// run scripts/localize_covers.py to fix that). Owner: Person 4.
import { useEffect, useState } from 'react';
import { dominantTint } from './tint';

const cache = new Map<string, Promise<string | null>>();

function sample(url: string): Promise<string | null> {
  const hit = cache.get(url);
  if (hit) return hit;
  const p = new Promise<string | null>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = c.height = 32;
        const ctx = c.getContext('2d', { willReadFrequently: true });
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, 32, 32);
        resolve(dominantTint(ctx.getImageData(0, 0, 32, 32).data));
      } catch { resolve(null); } // tainted canvas
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
  cache.set(url, p);
  return p;
}

export function useCoverTint(url: string | null | undefined, fallback: string): string {
  const [tint, setTint] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    setTint(null);
    if (url) sample(url).then((t) => { if (live) setTint(t); });
    return () => { live = false; };
  }, [url]);
  return tint ?? fallback;
}
