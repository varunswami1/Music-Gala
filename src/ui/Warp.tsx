import { useEffect, useRef } from 'react';
import { IN, OUT, clamp01, tx } from '../world/transition';

interface P { a: number; r: number; v: number; l: number }

/** 2D overlay for the door transition: black ramps in, then streaking lines, expanding frames and dots (the "tunnel"), then fades out. */
export function Warp() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current; if (!cv) return;
    const ctx = cv.getContext('2d'); if (!ctx) return;
    const parts: P[] = Array.from({ length: 240 }, () => ({ a: Math.random() * Math.PI * 2, r: Math.random(), v: 0.4 + Math.random() * 1.1, l: 0.03 + Math.random() * 0.12 }));
    let raf = 0, last = 0, spin = 0;
    const size = () => { const d = Math.min(window.devicePixelRatio || 1, 1.5); cv.width = innerWidth * d; cv.height = innerHeight * d; };
    size(); addEventListener('resize', size);

    const frame = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
      const t = performance.now() - tx.t0;
      let cover = 0, power = 0;
      if (tx.phase === 'out') { const k = clamp01(t / OUT); cover = Math.pow(clamp01((k - 0.45) / 0.55), 1.4); power = clamp01((k - 0.3) / 0.7); }
      else if (tx.phase === 'hold') { cover = 1; power = 1; }
      else if (tx.phase === 'in') { const k = clamp01(t / IN); cover = Math.pow(1 - k, 1.5); power = Math.pow(1 - k, 0.8); }
      const W = cv.width, H = cv.height, cx = W / 2, cy = H / 2, R = Math.hypot(cx, cy);
      ctx.clearRect(0, 0, W, H);
      if (tx.phase === 'idle') { raf = 0; return; }
      ctx.fillStyle = `rgba(0,0,0,${cover})`; ctx.fillRect(0, 0, W, H);
      if (power > 0.01) {
        spin += dt * (0.6 + 2.5 * power);
        ctx.lineWidth = Math.max(1, W / 1400);
        // expanding frames: a corridor receding into the distance
        for (let k = 0; k < 8; k++) {
          const z = (k / 8 + spin * 0.35) % 1, s = 0.03 + z * z * 1.9;
          ctx.strokeStyle = `rgba(255,255,255,${power * 0.5 * (1 - z * 0.85)})`;
          ctx.strokeRect(cx - (W * s) / 2, cy - (H * s) / 2, W * s, H * s);
        }
        // streaks flying outward from the vanishing point
        for (const p of parts) {
          p.r += dt * p.v * (0.25 + 2.2 * power); if (p.r > 1.1) { p.r = 0.02; p.a = Math.random() * Math.PI * 2; }
          const r0 = p.r * R, r1 = (p.r + p.l * (0.4 + 3 * power) * (0.3 + p.r)) * R, ca = Math.cos(p.a), sa = Math.sin(p.a);
          ctx.strokeStyle = `rgba(255,255,255,${power * (0.15 + 0.7 * p.r)})`;
          ctx.beginPath(); ctx.moveTo(cx + ca * r0, cy + sa * r0); ctx.lineTo(cx + ca * r1, cy + sa * r1); ctx.stroke();
        }
      }
      raf = requestAnimationFrame(frame);
    };
    const start = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } };
    tx.listeners.add(start);
    return () => { tx.listeners.delete(start); cancelAnimationFrame(raf); removeEventListener('resize', size); };
  }, []);
  return <canvas ref={ref} className="warp" />;
}
