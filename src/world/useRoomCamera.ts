import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { tx } from './transition';

type V3 = [number, number, number];
const UP = new THREE.Vector3(0, 1, 0);

/**
 * Moves the camera to `position`, looking at `lookAt`. Drag (mouse or touch) or the arrow keys turn the view a full 360° horizontally
 * and up/down within limits; the mouse also adds a very small parallax. After a door transition the camera glides in from behind.
 * Call once per Scene.
 */
export function useRoomCamera(position: V3, lookAt: V3, parallax = 0.25) {
  const gl = useThree((s) => s.gl);
  const target = useMemo(() => new THREE.Vector3(...position), [position[0], position[1], position[2]]);
  const look = useMemo(() => new THREE.Vector3(...lookAt), [lookAt[0], lookAt[1], lookAt[2]]);
  const cur = useRef(new THREE.Vector3(...lookAt));
  const yawGoal = useRef(0), pitchGoal = useRef(0), yaw = useRef(0), pitch = useRef(0), placed = useRef(false);

  useEffect(() => {
    const el = gl.domElement;
    let down = false, lx = 0, ly = 0;
    const onDown = (e: PointerEvent) => { if (e.button !== 0) return; down = true; lx = e.clientX; ly = e.clientY; };
    const onMove = (e: PointerEvent) => {
      if (!down) return;
      yawGoal.current += (e.clientX - lx) * 0.005;
      pitchGoal.current = THREE.MathUtils.clamp(pitchGoal.current + (e.clientY - ly) * 0.004, -0.9, 0.9);
      lx = e.clientX; ly = e.clientY;
    };
    const onUp = () => { down = false; };
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === 'ArrowLeft') yawGoal.current += 0.2;
      else if (e.key === 'ArrowRight') yawGoal.current -= 0.2;
      else if (e.key === 'ArrowUp') pitchGoal.current = Math.min(0.9, pitchGoal.current + 0.1);
      else if (e.key === 'ArrowDown') pitchGoal.current = Math.max(-0.9, pitchGoal.current - 0.1);
    };
    el.addEventListener('pointerdown', onDown); addEventListener('pointermove', onMove); addEventListener('pointerup', onUp); addEventListener('keydown', onKey);
    return () => { el.removeEventListener('pointerdown', onDown); removeEventListener('pointermove', onMove); removeEventListener('pointerup', onUp); removeEventListener('keydown', onKey); };
  }, [gl]);

  useFrame((state) => {
    if (tx.phase === 'out') return;                       // the transition director owns the camera while we leave
    if (!placed.current) {
      placed.current = true;
      if (tx.arrive) {                                    // arriving through a door: start a few metres behind and glide in
        tx.arrive = false;
        const back = target.clone().sub(look); back.y = 0; if (back.lengthSq() > 1e-4) back.normalize();
        state.camera.position.copy(target).addScaledVector(back, 6);
        cur.current.copy(look);
      }
    }
    state.camera.position.lerp(target, 0.06);
    cur.current.lerp(look, 0.06);
    state.camera.lookAt(cur.current);
    yaw.current = THREE.MathUtils.lerp(yaw.current, yawGoal.current, 0.15);
    pitch.current = THREE.MathUtils.lerp(pitch.current, pitchGoal.current, 0.15);
    state.camera.rotateOnWorldAxis(UP, yaw.current - state.pointer.x * parallax * 0.35);
    state.camera.rotateX(pitch.current + state.pointer.y * parallax * 0.15);
  });
}
