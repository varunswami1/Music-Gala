// Walking camera for Lobby and Studio. Owner: Person 2.
// You can walk AND turn all the way round. Controls:
//   scroll wheel / two-finger swipe  : walk forward (scroll down or swipe up) and back
//   W / ArrowUp = forward, S / ArrowDown = back, A = step left, D = step right
//   drag with the mouse, or Q / E, or ArrowLeft / ArrowRight : look around (turn 360 degrees)
//   one finger on a touch screen     : drag up = forward, drag sideways = turn
// "Forward" is whichever way you are facing (at the start it is -z). Pinch-zoom is blocked on purpose (trackpad pinch, Safari
// gesture, two-finger touch), so nothing changes size by zooming; you get closer by walking closer.
// Also plays the door transition (see transition.tsx) and lifts the camera over stairs via `ground`.
import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { V3 } from './build';
import { gate } from './transition';

export interface WalkOptions {
  /** Eye position where the visitor starts. */
  start: V3;
  /** Edit `next` in place to keep the visitor inside the room. `prev` is where they were last frame. */
  constrain: (next: THREE.Vector3, prev: THREE.Vector3) => void;
  /** Floor height at x,z (for stairs). Default flat. */
  ground?: (x: number, z: number) => number;
  speed?: number;
  parallax?: number;
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function useWalk({ start, constrain, ground, speed = 6, parallax = 0.12 }: WalkOptions) {
  const camera = useThree((s) => s.camera);
  const target = useRef(new THREE.Vector3(...start));
  const prev = useRef(new THREE.Vector3(...start));
  const keys = useRef({ f: false, b: false, l: false, r: false, tl: false, tr: false });
  const push = useRef(0);             // metres still to walk forward (negative = back), from wheel and touch
  const yaw = useRef(0);              // 0 = facing -z; positive turns left
  const pitch = useRef(0);
  const yawS = useRef(0);             // smoothed copies, what the camera really shows
  const pitchS = useRef(0);
  const constrainRef = useRef(constrain);
  const groundRef = useRef(ground);
  constrainRef.current = constrain;
  groundRef.current = ground;
  const tq = useRef(new THREE.Quaternion());
  const mat = useRef(new THREE.Matrix4());

  useEffect(() => {
    target.current.set(start[0], start[1], start[2]);
    prev.current.copy(target.current);
    yaw.current = 0; yawS.current = 0; pitch.current = 0; pitchS.current = 0;
    if (gate.phase === 'arriving') camera.position.set(start[0], start[1], start[2]); // come out of the dark at the start
    const typing = (e: Event) => {
      const t = e.target as HTMLElement | null;
      return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
    };
    const setKey = (down: boolean) => (e: KeyboardEvent) => {
      if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const ks = keys.current;
      if (k === 'w' || k === 'arrowup') ks.f = down;
      else if (k === 's' || k === 'arrowdown') ks.b = down;
      else if (k === 'a') ks.l = down;
      else if (k === 'd') ks.r = down;
      else if (k === 'q' || k === 'arrowleft') ks.tl = down;
      else if (k === 'e' || k === 'arrowright') ks.tr = down;
      else return;
      if (k.startsWith('arrow')) e.preventDefault();
    };
    const onDown = setKey(true);
    const onUp = setKey(false);
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) { e.preventDefault(); return; } // trackpad pinch arrives as ctrl+wheel: ignore it
      push.current += clamp(e.deltaY * 0.012, -3, 3);
    };
    // mouse drag to look around (touch uses the touch handlers below)
    let drag: { x: number; y: number } | null = null;
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || e.button !== 0) return;
      if ((e.target as HTMLElement).tagName !== 'CANVAS') return;
      drag = { x: e.clientX, y: e.clientY };
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!drag || e.pointerType === 'touch') return;
      yaw.current += (e.clientX - drag.x) * 0.0045;
      pitch.current = clamp(pitch.current + (e.clientY - drag.y) * 0.003, -0.6, 0.6);
      drag = { x: e.clientX, y: e.clientY };
    };
    const onPointerUp = () => { drag = null; };
    let touch: { x: number; y: number } | null = null;
    const onTouchStart = (e: TouchEvent) => { touch = e.touches.length === 1 ? { x: e.touches[0].clientX, y: e.touches[0].clientY } : null; };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) { e.preventDefault(); touch = null; return; } // two-finger pinch: ignore
      if (!touch) return;
      const x = e.touches[0].clientX; const y = e.touches[0].clientY;
      push.current += clamp((touch.y - y) * 0.03, -3, 3);
      yaw.current += (x - touch.x) * 0.006;
      touch = { x, y };
    };
    const onTouchEnd = () => { touch = null; };
    const stopGesture = (e: Event) => e.preventDefault(); // Safari pinch
    const blur = () => { keys.current = { f: false, b: false, l: false, r: false, tl: false, tr: false }; drag = null; };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', blur);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    for (const g of ['gesturestart', 'gesturechange', 'gestureend']) window.addEventListener(g, stopGesture);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', blur);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      for (const g of ['gesturestart', 'gesturechange', 'gestureend']) window.removeEventListener(g, stopGesture);
    };
  }, [start[0], start[1], start[2], camera]);

  // runs before anything else in the frame (negative priority does not take over rendering)
  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const cam = state.camera as THREE.PerspectiveCamera;

    // flying into a door: the transition owns the camera
    if (gate.phase === 'leaving') {
      if (!gate.fromSet) { gate.from.copy(cam.position); gate.fromSet = true; }
      cam.position.lerpVectors(gate.from, gate.to, Math.pow(gate.t, 1.8));
      if (cam.position.distanceTo(gate.to) > 0.05) {
        mat.current.lookAt(cam.position, gate.to, cam.up);
        tq.current.setFromRotationMatrix(mat.current);
        cam.quaternion.slerp(tq.current, 1 - Math.exp(-6 * dt));
      }
      const fov = 60 + gate.t * gate.t * 75;   // the view stretches into a tunnel
      if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }
      return;
    }
    const fov = gate.phase === 'arriving' ? 60 + 70 * Math.pow(1 - gate.t, 2) : 60;
    if (cam.fov !== fov) { cam.fov = fov; cam.updateProjectionMatrix(); }

    const t = target.current;
    const ks = keys.current;
    prev.current.copy(t);
    yaw.current += ((ks.tl ? 1 : 0) - (ks.tr ? 1 : 0)) * 1.8 * dt;
    yawS.current += (yaw.current - yawS.current) * (1 - Math.exp(-10 * dt));
    pitchS.current += (pitch.current - pitchS.current) * (1 - Math.exp(-10 * dt));
    const sy = Math.sin(yawS.current); const cy = Math.cos(yawS.current);
    const fwd = ((ks.f ? 1 : 0) - (ks.b ? 1 : 0)) * speed * dt + push.current; // metres forward this frame
    const side = ((ks.r ? 1 : 0) - (ks.l ? 1 : 0)) * speed * 0.8 * dt;
    t.x += -sy * fwd + cy * side;   // forward = (-sin yaw, -cos yaw), right = (cos yaw, -sin yaw)
    t.z += -cy * fwd - sy * side;
    push.current = 0;
    constrainRef.current(t, prev.current);
    t.y = start[1] + (groundRef.current ? groundRef.current(t.x, t.z) : 0);

    cam.position.lerp(t, 1 - Math.exp(-6 * dt));
    cam.rotation.order = 'YXZ';
    cam.rotation.set(pitchS.current + state.pointer.y * parallax * 0.5, yawS.current - state.pointer.x * parallax, 0);
  }, -1);
}
