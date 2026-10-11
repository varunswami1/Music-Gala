// Fixed eye camera for the round rooms. Owner: Person 3.
// The field of view and zoom are NEVER touched: the shell sets fov once and we only move/aim the camera.
import { useLayoutEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';

type V3 = [number, number, number];

/** Eye at `pos` looking at `look`, with a small mouse look-around. Snaps on mount (the tunnel hides the cut). */
export function useFixedCamera(pos: V3, look: V3, yaw = 0.3, pitch = 0.04) {
  const camera = useThree((s) => s.camera);
  useLayoutEffect(() => {
    camera.position.set(pos[0], pos[1], pos[2]);
    camera.lookAt(look[0], look[1], look[2]);
  }, [camera, pos[0], pos[1], pos[2], look[0], look[1], look[2]]);
  useFrame(({ camera: c, pointer }) => {
    c.position.set(pos[0], pos[1], pos[2]);
    c.lookAt(look[0], look[1], look[2]);
    c.rotateY(-pointer.x * yaw);
    c.rotateX(pointer.y * pitch);
  });
}
