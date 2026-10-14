// The narrow lobby you walk through when entering a round room (reference video: one room to the next through a narrow passage).
// It stays attached to the room's back wall as an entrance. Owner: Person 3.
import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

export const VEST_W = 3.4, VEST_H = 3.8;

/** Wire passage along +z from zFrom (room side) to zTo (outside), with a funnel to a wider frame at zFrom. */
export function vestibuleGeometry(zFrom: number, zTo: number, wideW: number, wideH: number, step = 2.5): THREE.BufferGeometry {
  const pts: number[] = [];
  const seg = (a: number[], b: number[]) => pts.push(a[0], a[1], a[2], b[0], b[1], b[2]);
  const x = VEST_W / 2;
  const rect = (z: number, hx: number, hy: number, y0: number) => {
    seg([-hx, y0, z], [hx, y0, z]); seg([hx, y0, z], [hx, y0 + hy, z]); seg([hx, y0 + hy, z], [-hx, y0 + hy, z]); seg([-hx, y0 + hy, z], [-hx, y0, z]);
  };
  for (let z = zFrom; z <= zTo; z += step) rect(z, x, VEST_H, 0);
  for (const [px, py] of [[-x, 0], [x, 0], [x, VEST_H], [-x, VEST_H]]) seg([px, py, zFrom], [px, py, zTo]);
  rect(zFrom, wideW / 2, wideH, 0);                                    // the doorway frame into the big room
  for (const [sx, sy] of [[-1, 0], [1, 0], [1, 1], [-1, 1]]) seg([sx * x, sy * VEST_H, zFrom], [sx * wideW / 2, sy * wideH, zFrom]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

/** Entrance for the round rooms: wall of the cylinder at z=+20, passage out to z=+42. */
export function RoomVestibule({ wallZ = 20 }: { wallZ?: number }) {
  const geo = useMemo(() => vestibuleGeometry(wallZ, wallZ + 22, 7, 5.2), [wallZ]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <lineSegments geometry={geo}><lineBasicMaterial color="#ffffff" transparent opacity={0.3} /></lineSegments>;
}
