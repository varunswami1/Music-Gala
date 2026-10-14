import { useEffect, useRef } from 'react';
import { IN, OUT, clamp01, tx } from '../world/transition';

/** Light that floods the screen as the camera passes through the slit, then clears to reveal the new room. */
export function Warp() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    let raf = 0;
    const frame = () => {
      const t = performance.now() - tx.t0;
      let cover = 0;
      if (tx.phase === 'out') cover = Math.pow(clamp01((t / OUT - 0.5) / 0.45), 1.3);
      else if (tx.phase === 'hold') cover = 1;
      else if (tx.phase === 'in') cover = Math.pow(1 - clamp01(t / IN), 1.7);
      el.style.opacity = String(cover);
      raf = tx.phase === 'idle' ? 0 : requestAnimationFrame(frame);
    };
    const start = () => { if (!raf) raf = requestAnimationFrame(frame); };
    tx.listeners.add(start);
    return () => { tx.listeners.delete(start); cancelAnimationFrame(raf); };
  }, []);
  return <div ref={ref} className="warp" />;
}
