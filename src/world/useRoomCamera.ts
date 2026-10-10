import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { cam, overrideProfile, type CameraProfile } from './cameraInput';
import { useApp } from '../store/app';

type V3 = [number, number, number];
const UP = new THREE.Vector3(0, 1, 0);
const tmpPos = new THREE.Vector3();
const tmpLook = new THREE.Vector3();

/**
 * Moves the camera to `position`, looking at `lookAt`, with a small mouse parallax. Call once per Scene.
 * The shell adds, on top of that: drag-to-look, scroll-to-move along the room's view direction, the room-change push,
 * and reduced-motion (no parallax, no easing). Signature is backward compatible.
 * `opts` (optional) overrides this room's camera profile, e.g. `{ move: false }` if the room uses the wheel itself.
 */
export function useRoomCamera(position: V3, lookAt: V3, parallax = 0.25, opts?: Partial<CameraProfile>) {
  const target = useMemo(() => new THREE.Vector3(...position), [position[0], position[1], position[2]]);
  const look = useMemo(() => new THREE.Vector3(...lookAt), [lookAt[0], lookAt[1], lookAt[2]]);
  // horizontal direction from the standing spot to the look target: the "rail" that scroll-to-move slides along
  const dir = useMemo(() => {
    const d = new THREE.Vector3().subVectors(look, target);
    d.y = 0;
    return d.lengthSq() > 1e-6 ? d.normalize() : new THREE.Vector3(0, 0, -1);
  }, [target, look]);
  const cur = useRef(new THREE.Vector3(...lookAt));
  const optsKey = opts ? JSON.stringify(opts) : '';

  useEffect(() => (opts ? overrideProfile(opts) : undefined), [optsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useFrame((state, dt) => {
    const reduced = useApp.getState().reducedMotion;
    const travel = (cam.profile.move ? cam.move : 0) + cam.push;
    tmpPos.copy(target).addScaledVector(dir, travel);
    tmpLook.copy(look).addScaledVector(dir, travel);
    const k = reduced ? 1 : 1 - Math.exp(-Math.min(dt, 0.1) * 3.6); // ≈ 0.06 per frame at 60 fps, but frame-rate independent
    state.camera.position.lerp(tmpPos, k);
    cur.current.lerp(tmpLook, k);
    state.camera.lookAt(cur.current);
    if (cam.yaw) state.camera.rotateOnWorldAxis(UP, cam.yaw);
    if (cam.pitch) state.camera.rotateX(cam.pitch);
    const par = reduced ? 0 : parallax;
    state.camera.rotateY(-state.pointer.x * par);
    state.camera.rotateX(state.pointer.y * par * 0.5);
  });
}
