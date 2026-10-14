// Tunnel transition between rooms (reference: the "virtually" site). Owner: Person 3.
// The room camera flies into the gate (see travel.ts), the screen fades to black, the route changes, and the next room opens
// with a walk through a narrow lobby (see Vestibule.tsx / Corridor.tsx).
// Use tunnelGo(path) for a route change, tunnelDo(fn) for an in-room change (e.g. opening a playlist).
import { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { useApp } from '../../store/app';
import { prefersReducedMotion } from './motion';
import { travel } from './travel';

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

// Timeline (ms): 0-650 the room camera flies forward (travel.t 0..1) and the screen darkens from 400; the route changes at 650
// while black; hold until 800; fade open 800-1300 while the NEW room walks you in through its narrow lobby.
const FLY = 650, HOLD_END = 800, TOTAL = 1300;

function envelope(ms: number): number {
  if (ms < 400) return 0;
  if (ms < FLY) { const x = (ms - 400) / (FLY - 400); return x * x * (3 - 2 * x); }
  if (ms < HOLD_END) return 1;
  const x = (ms - HOLD_END) / (TOTAL - HOLD_END); return 1 - x * x * (3 - 2 * x);
}

function draw(ctx: CanvasRenderingContext2D, w: number, h: number, env: number, dpr: number, label: string) {
  ctx.clearRect(0, 0, w, h);
  if (env <= 0.01) return;
  ctx.fillStyle = `rgba(0,0,0,${env.toFixed(3)})`;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = `rgba(255,255,255,${env.toFixed(3)})`;
  ctx.beginPath(); ctx.arc(w / 2, h / 2, 3 * dpr, 0, Math.PI * 2); ctx.fill();
  if (label && env > 0.5) {
    ctx.font = `${12 * dpr}px ui-monospace, Menlo, Consolas, monospace`;
    ctx.textAlign = 'center';
    ctx.fillStyle = `rgba(255,255,255,${((env - 0.5) * 1.4).toFixed(3)})`;
    ctx.fillText(label.toUpperCase().split('').join(' '), w / 2, h / 2 + h * 0.07);
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
      const ms = now - t0;
      travel.t = Math.min(1, ms / FLY);
      if (!fired && ms >= FLY) { fired = true; const a = pending; pending = null; a?.(); travel.t = 0; travel.target = null; travel.look = null; }
      draw(ctx, c.width, c.height, envelope(ms), dpr, label);
      if (ms < TOTAL) raf = requestAnimationFrame(frame); else useTunnel.getState().stop();
    };
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf); window.removeEventListener('resize', resize);
      travel.t = 0; travel.target = null; travel.look = null;
      if (!fired) { const a = pending; pending = null; a?.(); }   // never lose a navigation
    };
  }, [active, label]);
  if (!active) return null;
  return <canvas ref={ref} aria-hidden style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', zIndex: 70, pointerEvents: 'auto' }} />;
}
