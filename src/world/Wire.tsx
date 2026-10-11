import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

type V3 = [number, number, number];
/** Every room outline is drawn in ONE shared colour so rooms look like one place. `color` is still accepted so old calls compile,
 *  but it is ignored on purpose (rooms used to tint the outline with their scene accent). */
export const OUTLINE_COLOR = '#ffffff';
export const OUTLINE_OPACITY = 0.35;
interface WireProps { position?: V3; color?: string; opacity?: number }

/** Wire box outline. Geometry is disposed on unmount. */
export function WireBox({ size, position = [0, 0, 0] }: WireProps & { size: V3 }) {
  const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(...size)), [size[0], size[1], size[2]]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <lineSegments geometry={geo} position={position}>
      <lineBasicMaterial color={OUTLINE_COLOR} transparent opacity={OUTLINE_OPACITY} />
    </lineSegments>
  );
}

/** Open cylinder outline: the shared "round room" used by the Song, Artist and Library rooms. */
export function WireCylinder({ radius, height, segments = 32, position = [0, 0, 0] }:
  WireProps & { radius: number; height: number; segments?: number }) {
  const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.CylinderGeometry(radius, radius, height, segments, 1, true)), [radius, height, segments]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <lineSegments geometry={geo} position={position}>
      <lineBasicMaterial color={OUTLINE_COLOR} transparent opacity={OUTLINE_OPACITY} />
    </lineSegments>
  );
}
