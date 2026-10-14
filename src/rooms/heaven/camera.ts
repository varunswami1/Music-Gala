// Fixed eye camera for the round rooms. Owner: Person 3.
// The field of view and zoom are NEVER touched: we only move/aim the camera.
// Arrival: every round room is entered through a narrow lobby (see Vestibule.tsx), walking in from `arriveFromZ`.
// Departure: when a transition starts, the camera glides forward a few units before the screen goes dark.
import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { prefersReducedMotion } from './motion';
import { easeIn, easeInOut, travel } from './travel';

type V3 = [number, number, number];
export const ARRIVE_FROM_Z = 38;
const ARRIVE_S = 2.6;

export function useFixedCamera(pos: V3, look: V3, yaw = 0.3, pitch = 0.04) {
  const camera = useThree((s) => s.camera);
  const reduce = useMemo(prefersReducedMotion, []);
  const arr = useRef(reduce ? 1 : 0);
  useLayoutEffect(() => {
    camera.position.set(pos[0], pos[1], reduce ? pos[2] : ARRIVE_FROM_Z);
    camera.lookAt(look[0], look[1], look[2] - (reduce ? 0 : ARRIVE_FROM_Z - pos[2]));
  }, [camera, reduce, pos[0], pos[1], pos[2], look[0], look[1], look[2]]);
  useFrame(({ camera: c, pointer }, dt) => {
    arr.current = Math.min(1, arr.current + dt / ARRIVE_S);
    const e = easeInOut(arr.current);
    const z = pos[2] + (ARRIVE_FROM_Z - pos[2]) * (1 - e) - (travel.t > 0 ? easeIn(travel.t) * 6 : 0);
    c.position.set(pos[0], pos[1], z);
    c.lookAt(look[0], look[1], look[2] + (z - pos[2]));
    const look_ = arr.current < 1 || travel.t > 0 ? 0 : 1;           // no mouse look-around while walking in / out
    c.rotateY(-pointer.x * yaw * look_);
    c.rotateX(pointer.y * pitch * look_);
  });
}
