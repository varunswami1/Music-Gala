// Same camera as world/useRoomCamera (mouse parallax) plus look-around: drag with the left button, or use the
// left/right arrow keys. Used by the Song and Artist rooms so their doors can sit out of the first view and still be
// reachable. A click that moves the pointer more than a couple of pixels is a drag, and R3F does not fire onClick for it.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

type V3 = [number, number, number];
const MAX_YAW = 1.95; // about 112 degrees each way

export function useLookCamera(position: V3, lookAt: V3, parallax = 0.25) {
  const gl = useThree((s) => s.gl);
  const target = useMemo(() => new THREE.Vector3(...position), [position[0], position[1], position[2]]);
  const look = useMemo(() => new THREE.Vector3(...lookAt), [lookAt[0], lookAt[1], lookAt[2]]);
  const cur = useRef(new THREE.Vector3(...lookAt));
  const yaw = useRef({ goal: 0, now: 0 });

  useEffect(() => {
    const el = gl.domElement;
    let down = false, lastX = 0;
    const clamp = (v: number) => Math.max(-MAX_YAW, Math.min(MAX_YAW, v));
    const onDown = (e: PointerEvent) => { if (e.button === 0) { down = true; lastX = e.clientX; } };
    const onMove = (e: PointerEvent) => { if (!down) return; yaw.current.goal = clamp(yaw.current.goal + (e.clientX - lastX) * 0.005); lastX = e.clientX; };
    const onUp = () => { down = false; };
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest('.lyrics, .list, .bio'))) return;
      yaw.current.goal = clamp(yaw.current.goal + (e.key === 'ArrowLeft' ? 0.12 : -0.12));
      e.preventDefault();
    };
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    window.addEventListener('keydown', onKey);
    return () => {
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      window.removeEventListener('keydown', onKey);
    };
  }, [gl]);

  useFrame((state) => {
    const y = yaw.current;
    y.now += (y.goal - y.now) * 0.12;
    state.camera.position.lerp(target, 0.06);
    cur.current.lerp(look, 0.06);
    state.camera.lookAt(cur.current);
    state.camera.rotateY(y.now - state.pointer.x * parallax);
    state.camera.rotateX(state.pointer.y * parallax * 0.5);
  });
}
