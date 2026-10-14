// Same camera as world/useRoomCamera (mouse parallax) plus free look-around: drag with the left button or use the
// left/right arrow keys, all the way round (no limit). Used by the Song and Artist rooms.
// The camera is aimed with explicit yaw/pitch in 'YXZ' order, so the horizon stays level and walls stay upright
// (the old lookAt + rotateY combination rolled the view as soon as you turned). A drag of more than ~2px is not a click.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

type V3 = [number, number, number];
const reduced = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

export function useLookCamera(position: V3, lookAt: V3, parallax = 0.25) {
  const gl = useThree((s) => s.gl);
  const target = useMemo(() => new THREE.Vector3(...position), [position[0], position[1], position[2]]);
  const look = useMemo(() => new THREE.Vector3(...lookAt), [lookAt[0], lookAt[1], lookAt[2]]);
  const cur = useRef(new THREE.Vector3(...lookAt));
  const yaw = useRef({ goal: 0, now: 0 });
  const still = useMemo(reduced, []);

  useEffect(() => {
    const el = gl.domElement;
    let down = false, lastX = 0;
    const onDown = (e: PointerEvent) => { if (e.button === 0) { down = true; lastX = e.clientX; } };
    const onMove = (e: PointerEvent) => { if (down) { yaw.current.goal += (e.clientX - lastX) * 0.005; lastX = e.clientX; } };
    const onUp = () => { down = false; };
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.closest('.lyrics, .list, .bio'))) return;
      yaw.current.goal += e.key === 'ArrowLeft' ? 0.12 : -0.12;
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
    y.now = still ? y.goal : y.now + (y.goal - y.now) * 0.12;
    const cam = state.camera;
    cam.position.lerp(target, still ? 1 : 0.06);
    cur.current.lerp(look, still ? 1 : 0.06);
    const dx = cur.current.x - cam.position.x, dy = cur.current.y - cam.position.y, dz = cur.current.z - cam.position.z;
    const baseYaw = Math.atan2(-dx, -dz), basePitch = Math.atan2(dy, Math.hypot(dx, dz));
    const p = still ? 0 : parallax;
    cam.rotation.order = 'YXZ';
    cam.rotation.set(basePitch + state.pointer.y * p * 0.5, baseYaw + y.now - state.pointer.x * p, 0);
  });
}
