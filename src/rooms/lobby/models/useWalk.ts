// Walking camera for Lobby and Studio. Owner: Person 2.
// Forward is always -z (the way the camera faces). Controls:
//   scroll wheel / two-finger swipe  : DOWN or UP-swipe = walk forward (like "scroll to approach")
//   W / ArrowUp = forward, S / ArrowDown = back, A / ArrowLeft = left, D / ArrowRight = right
//   one finger dragging up           : forward
// Pinch-zoom (trackpad pinch, Safari gesture, two-finger touch) is blocked on purpose, so objects never change size
// by zooming; the only way to get closer is to walk closer. The mouse still looks around a little (parallax).
import { useEffect, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { V3 } from './build';

export interface WalkOptions {
  /** Eye position where the visitor starts. */
  start: V3;
  /** Edit `next` in place to keep the visitor inside the room. `prev` is where they were last frame. */
  constrain: (next: THREE.Vector3, prev: THREE.Vector3) => void;
  speed?: number;
  parallax?: number;
}

export const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function useWalk({ start, constrain, speed = 6, parallax = 0.25 }: WalkOptions) {
  const target = useRef(new THREE.Vector3(...start));
  const prev = useRef(new THREE.Vector3(...start));
  const look = useRef(new THREE.Vector3(start[0], start[1], start[2] - 20));
  const keys = useRef({ f: false, b: false, l: false, r: false });
  const push = useRef(0); // metres still to walk forward (negative = back), from wheel and touch
  const constrainRef = useRef(constrain);
  constrainRef.current = constrain;

  useEffect(() => {
    target.current.set(start[0], start[1], start[2]);
    prev.current.copy(target.current);
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
      else if (k === 'a' || k === 'arrowleft') ks.l = down;
      else if (k === 'd' || k === 'arrowright') ks.r = down;
      else return;
      if (k.startsWith('arrow')) e.preventDefault();
    };
    const onDown = setKey(true);
    const onUp = setKey(false);
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey) { e.preventDefault(); return; } // trackpad pinch arrives as ctrl+wheel: ignore it
      push.current += clamp(e.deltaY * 0.012, -3, 3);
    };
    let touchY: number | null = null;
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches.length === 1 ? e.touches[0].clientY : null; };
    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) { e.preventDefault(); touchY = null; return; } // two-finger pinch: ignore
      if (touchY === null) return;
      const y = e.touches[0].clientY;
      push.current += clamp((touchY - y) * 0.03, -3, 3);
      touchY = y;
    };
    const onTouchEnd = () => { touchY = null; };
    const stopGesture = (e: Event) => e.preventDefault(); // Safari pinch
    const blur = () => { keys.current = { f: false, b: false, l: false, r: false }; };

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    window.addEventListener('blur', blur);
    window.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', onTouchEnd);
    for (const g of ['gesturestart', 'gesturechange', 'gestureend']) window.addEventListener(g, stopGesture);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
      window.removeEventListener('blur', blur);
      window.removeEventListener('wheel', onWheel);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      for (const g of ['gesturestart', 'gesturechange', 'gestureend']) window.removeEventListener(g, stopGesture);
    };
  }, [start[0], start[1], start[2]]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = target.current;
    const ks = keys.current;
    prev.current.copy(t);
    const fwd = (ks.f ? 1 : 0) - (ks.b ? 1 : 0);
    const side = (ks.r ? 1 : 0) - (ks.l ? 1 : 0);
    t.z -= fwd * speed * dt + push.current; // forward is -z
    t.x += side * speed * 0.8 * dt;
    push.current = 0;
    constrainRef.current(t, prev.current);

    const cam = state.camera;
    cam.position.lerp(t, 1 - Math.exp(-6 * dt));
    look.current.lerp(new THREE.Vector3(cam.position.x, start[1], cam.position.z - 20), 1 - Math.exp(-8 * dt));
    cam.lookAt(look.current);
    cam.rotateY(-state.pointer.x * parallax);
    cam.rotateX(state.pointer.y * parallax * 0.5);
  });
}
