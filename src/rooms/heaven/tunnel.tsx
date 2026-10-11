// Tunnel transition between rooms (reference: the "virtually" site). Owner: Person 3.
// Wire rectangles rush toward the viewer, the screen goes black, the route changes at the midpoint, then it opens again.
// Use tunnelGo(path) for a route change, tunnelDo(fn) for an in-room change (e.g. opening a playlist).
import { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { useApp } from '../../store/app';
import { prefersReducedMotion } from './motion';

interface TunnelState { active: boolean; label: string; start: (label: string) => void; stop: () => void }
const useTunnel = create<TunnelState>((set) => ({
  active: false, label: '',
  start: (label) => set({ active: true, label }),
  stop: () => set({ active: false }),
}));
let pending: (() => void) | null = null;

/** Run `action` at the midpoint of the tunnel. */
export function tunnelDo(action: () => void, label = '') {
  if (useTunnel.getState().active) return;
  if (prefersReducedMotion()) { action(); return; }
  pending = action;
  useTunnel.getState().start(label);
}
/** Navigate to `path` through the tunnel. */
export function tunnelGo(path: string, label = '') {
  tunnelDo(() => useApp.getState().go(path), label);
}

const DURATION = 1300; // ms: rush in (0-40%), black hold (40-55%), open (55-100%); route changes at 50%

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, t: number, env: number, dpr: number, label: string) {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = `rgba(0,0,0,${Math.min(1, env * 1.2).toFixed(3)})`;
  ctx.fillRect(0, 0, w, h);
  if (env <= 0.02) return;
  const cx = w / 2, cy = h / 2;
  const phase = t * 2.4 + t * t * 3;           // speeds up over time
  ctx.lineWidth = Math.max(1, dpr);
  const N = 14;
  for (let k = 0; k < N; k++) {
    const p = (phase + k / N) % 1;             // 0 = far, 1 = at the viewer
    const s = Math.pow(p, 3);
    const hw = w * 0.03 + s * w * 0.95, hh = h * 0.03 + s * h * 0.95;
    ctx.strokeStyle = `rgba(255,255,255,${(Math.sin(p * Math.PI) * env * 0.85).toFixed(3)})`;
    ctx.strokeRect(cx - hw, cy - hh, hw * 2, hh * 2);
  }
  ctx.strokeStyle = `rgba(255,255,255,${(0.28 * env).toFixed(3)})`;   // corridor edges: 8 lines from the far end to the screen edge
  ctx.beginPath();
  for (const [ax, ay] of [[-1, -1], [0, -1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0]]) {
    ctx.moveTo(cx + ax * w * 0.03, cy + ay * h * 0.03);
    ctx.lineTo(cx + ax * w, cy + ay * h);
  }
  ctx.stroke();
  ctx.fillStyle = `rgba(255,255,255,${env.toFixed(3)})`;
  ctx.beginPath(); ctx.arc(cx, cy, 4 * dpr, 0, Math.PI * 2); ctx.fill();
  if (label) {
    ctx.font = `${12 * dpr}px ui-monospace, Menlo, Consolas, monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255,255,255,${(env * 0.75).toFixed(3)})`;
    ctx.fillText(label.toUpperCase().split('').join(' '), cx, cy + h * 0.16);
  }
}

/** Mount once in App (above the canvas and overlay). */
export function TunnelOverlay() {
  const active = useTunnel((s) => s.active);
  const label = useTunnel((s) => s.label);
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!active) return;
    const c = ref.current; const ctx = c?.getContext('2d');
    if (!c || !ctx) { pending?.(); pending = null; useTunnel.getState().stop(); return; }
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => { c.width = Math.round(window.innerWidth * dpr); c.height = Math.round(window.innerHeight * dpr); };
    resize();
    window.addEventListener('resize', resize);
    const t0 = performance.now();
    let raf = 0; let fired = false;
    const frame = (now: number) => {
      const t = Math.min(1, (now - t0) / DURATION);
      const env = t < 0.4 ? t / 0.4 : t < 0.55 ? 1 : 1 - (t - 0.55) / 0.45;
      if (!fired && t >= 0.5) { fired = true; const a = pending; pending = null; a?.(); }
      draw(ctx, c.width, c.height, t, env, dpr, label);
      if (t < 1) raf = requestAnimationFrame(frame); else useTunnel.getState().stop();
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf); window.removeEventListener('resize', resize);
      if (!fired) { const a = pending; pending = null; a?.(); }   // never lose a navigation
    };
  }, [active, label]);
  if (!active) return null;
  return <canvas ref={ref} aria-hidden style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 70, pointerEvents: 'auto' }} />;
}
