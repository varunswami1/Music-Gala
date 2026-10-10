import { useEffect, useMemo } from 'react';
import * as THREE from 'three';

type V3 = [number, number, number];
interface WireProps { position?: V3; color?: string; opacity?: number }

/** Wire box outline. Geometry is disposed on unmount. */
export function WireBox({ size, position = [0, 0, 0], color = '#ffffff', opacity = 0.35 }: WireProps & { size: V3 }) {
  const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(...size)), [size[0], size[1], size[2]]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <lineSegments geometry={geo} position={position}>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </lineSegments>
  );
}

/** Open cylinder outline: the shared "round room" used by the Song, Artist and Library rooms. */
export function WireCylinder({ radius, height, segments = 32, position = [0, 0, 0], color = '#ffffff', opacity = 0.35 }:
  WireProps & { radius: number; height: number; segments?: number }) {
  const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.CylinderGeometry(radius, radius, height, segments, 1, true)), [radius, height, segments]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <lineSegments geometry={geo} position={position}>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </lineSegments>
  );
}
