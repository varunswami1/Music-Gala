// Pure colour maths for the cover tint (no React, no three.js). Owner: Person 4.

export function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h /= 6;
  return [h, s, l];
}

export function hslToHex(h: number, s: number, l: number): string {
  const f = (n: number) => {
    const k = (n + h * 12) % 12;
    const a = s * Math.min(l, 1 - l);
    const v = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1));
    return Math.round(v * 255).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Picks the most colourful hue in RGBA pixel data and returns a bright, saturated version of it that reads on black.
 * Returns null for (near) greyscale images, so the caller can fall back to the room accent.
 */
export function dominantTint(rgba: ArrayLike<number>): string | null {
  const BUCKETS = 12;
  const weight = new Array<number>(BUCKETS).fill(0);
  const sum = Array.from({ length: BUCKETS }, () => [0, 0, 0]);
  let pixels = 0;
  for (let i = 0; i + 3 < rgba.length; i += 4) {
    if (rgba[i + 3] < 200) continue;
    pixels++;
    const [h, s, l] = rgbToHsl(rgba[i], rgba[i + 1], rgba[i + 2]);
    const w = s * (1 - Math.abs(2 * l - 1)); // dark, light and grey pixels count for little
    if (w <= 0) continue;
    const b = Math.min(BUCKETS - 1, Math.floor(h * BUCKETS));
    weight[b] += w;
    sum[b][0] += rgba[i] * w; sum[b][1] += rgba[i + 1] * w; sum[b][2] += rgba[i + 2] * w;
  }
  if (!pixels) return null;
  let best = 0;
  for (let b = 1; b < BUCKETS; b++) if (weight[b] > weight[best]) best = b;
  if (weight[best] < pixels * 0.04) return null; // basically greyscale
  const [h, s] = rgbToHsl(sum[best][0] / weight[best], sum[best][1] / weight[best], sum[best][2] / weight[best]);
  return hslToHex(h, Math.max(0.45, Math.min(0.9, s)), 0.6);
}
