// Free 360° turning of a round room. Owner: Person 3.
// Tap ← → (or A D) = one card step; hold = keep turning continuously (about 100° per second), so you can take a full lap.
import { useEffect, useRef, type MutableRefObject } from 'react';
import { isTyping } from './motion';

const HOLD_AFTER_MS = 280, SPEED = 1.8; // rad/s

export function useTurn(stepRef: MutableRefObject<number>) {
  const target = useRef(0);
  const current = useRef(0);
  const held = useRef({ dir: 0, since: 0 });
  useEffect(() => {
    const dirOf = (e: KeyboardEvent) => { const k = e.key.toLowerCase(); return k === 'arrowleft' || k === 'a' ? 1 : k === 'arrowright' || k === 'd' ? -1 : 0; };
    const down = (e: KeyboardEvent) => {
      if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      const dir = dirOf(e); if (!dir) return;
      e.preventDefault();
      if (!e.repeat) { target.current += dir * stepRef.current; held.current = { dir, since: performance.now() }; }
    };
    const up = (e: KeyboardEvent) => { if (dirOf(e) === held.current.dir) held.current.dir = 0; };
    const blur = () => { held.current.dir = 0; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, [stepRef]);
  /** Call once per frame; returns the current rotation in radians. */
  const tick = (dt: number, reduce: boolean) => {
    const h = held.current;
    if (h.dir && performance.now() - h.since > HOLD_AFTER_MS) target.current += h.dir * SPEED * dt;
    current.current = reduce ? target.current : current.current + (target.current - current.current) * (1 - Math.exp(-dt * 6));
    return current.current;
  };
  return { target, current, tick };
}
