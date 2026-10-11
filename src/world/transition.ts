// Door-to-room transition: zoom into the clicked door, line/dot tunnel, arrive in the new room (reference: virtuallyeverafter).
// Shared module state (not React state) so the 3D canvas and the 2D overlay can both read it every frame.
import * as THREE from 'three';

export type Phase = 'idle' | 'out' | 'hold' | 'in';
export const OUT = 750, HOLD = 520, IN = 850;   // ms: zoom into door, tunnel, arrive

export const tx = {
  phase: 'idle' as Phase,
  t0: 0,
  door: null as THREE.Vector3 | null,         // world position of the clicked door's centre
  pendingDoor: null as THREE.Vector3 | null,  // set by Door on click, consumed by the next go()
  pendingAt: 0,
  arrive: false,                              // true until the new room's camera hook has placed the camera
  captured: false,
  startPos: new THREE.Vector3(),
  startQuat: new THREE.Quaternion(),
  startFov: 60,
  listeners: new Set<() => void>(),
};
const notify = () => tx.listeners.forEach((f) => f());

export function rememberDoor(p: THREE.Vector3) { tx.pendingDoor = p.clone(); tx.pendingAt = performance.now(); }

/** Navigate with the transition. Falls back to a plain navigate for reduced motion, the same path, or a transition already running. */
export function runTransition(path: string, navigate: (p: string) => void) {
  const door = tx.pendingDoor && performance.now() - tx.pendingAt < 500 ? tx.pendingDoor : null;
  tx.pendingDoor = null;
  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (tx.phase !== 'idle' || reduce || path === window.location.pathname) { if (tx.phase === 'idle') navigate(path); return; }
  tx.door = door; tx.captured = false; tx.phase = 'out'; tx.t0 = performance.now(); notify();
  window.setTimeout(() => { tx.phase = 'hold'; tx.t0 = performance.now(); tx.arrive = true; navigate(path); notify(); }, OUT);
  window.setTimeout(() => { tx.phase = 'in'; tx.t0 = performance.now(); notify(); }, OUT + HOLD);
  window.setTimeout(() => { tx.phase = 'idle'; tx.arrive = false; notify(); }, OUT + HOLD + IN);
}

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
