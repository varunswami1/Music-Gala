// A circular colonnade: pillars with bases and capitals, an architrave ring, dome ribs up to an oculus, and rings on the floor.
// Drawn as thin lines only. Put the camera near the centre and the structure surrounds you in every direction.
import { useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

interface Props { radius?: number; height?: number; count?: number; color?: string; position?: [number, number, number] }

const ring = (r: number, y: number, seg = 96) => Array.from({ length: seg }, (_, i) => {
  const a = (i / seg) * Math.PI * 2, b = ((i + 1) / seg) * Math.PI * 2;
  return [new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r), new THREE.Vector3(Math.cos(b) * r, y, Math.sin(b) * r)];
}).flat();

export function Colonnade({ radius = 10.5, height = 7.2, count = 16, color = '#ffffff', position = [0, 0, 0] }: Props) {
  const g = useMemo(() => {
    const pillars: THREE.BufferGeometry[] = [], beams: THREE.BufferGeometry[] = [];
    const base = 0.3, cap = 0.4, shaftH = height - base - cap;
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2, x = Math.cos(a) * radius, z = Math.sin(a) * radius;
      const parts = [
        new THREE.BoxGeometry(1.25, base, 1.25).translate(0, base / 2, 0),
        new THREE.CylinderGeometry(0.42, 0.46, shaftH, 14, 1).translate(0, base + shaftH / 2, 0),
        new THREE.CylinderGeometry(0.62, 0.42, cap, 14, 1).translate(0, base + shaftH + cap / 2, 0),
        new THREE.BoxGeometry(1.3, 0.12, 1.3).translate(0, height + 0.06, 0),
      ];
      for (const p of parts) { p.rotateY(-a); p.translate(x, 0, z); pillars.push(p); }
      // beam spanning to the next pillar
      const a2 = ((i + 1) / count) * Math.PI * 2, x2 = Math.cos(a2) * radius, z2 = Math.sin(a2) * radius;
      const len = Math.hypot(x2 - x, z2 - z);
      const beam = new THREE.BoxGeometry(len, 0.5, 0.6); beam.rotateY(-Math.atan2(z2 - z, x2 - x)); beam.translate((x + x2) / 2, height + 0.37, (z + z2) / 2); beams.push(beam);
    }
    const pillarEdges = new THREE.EdgesGeometry(mergeGeometries(pillars)!, 5);
    const beamEdges = new THREE.EdgesGeometry(mergeGeometries(beams)!, 5);
    // dome: ribs rising from the architrave to a ring (the oculus), with parallel rings between
    const top = height + 0.62, domeH = 3.4, oculus = 2.0, rings = 4, dome: THREE.Vector3[] = [];
    const rAt = (t: number) => radius + (oculus - radius) * t, yAt = (t: number) => top + domeH * Math.sin(t * Math.PI / 2);
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      for (let k = 0; k < 8; k++) { const t0 = k / 8, t1 = (k + 1) / 8; dome.push(new THREE.Vector3(Math.cos(a) * rAt(t0), yAt(t0), Math.sin(a) * rAt(t0)), new THREE.Vector3(Math.cos(a) * rAt(t1), yAt(t1), Math.sin(a) * rAt(t1))); }
    }
    for (let k = 1; k <= rings; k++) dome.push(...ring(rAt(k / (rings + 1)), yAt(k / (rings + 1)), 64));
    dome.push(...ring(oculus, yAt(1), 40));
    // floor: concentric rings and spokes
    const floor: THREE.Vector3[] = [];
    for (let r = 2; r <= radius - 0.6; r += 2) floor.push(...ring(r, 0.012, 80));
    for (let i = 0; i < count * 2; i++) { const a = (i / (count * 2)) * Math.PI * 2; floor.push(new THREE.Vector3(Math.cos(a) * 1.2, 0.012, Math.sin(a) * 1.2), new THREE.Vector3(Math.cos(a) * (radius - 0.6), 0.012, Math.sin(a) * (radius - 0.6))); }
    return { pillarEdges, beamEdges, dome: new THREE.BufferGeometry().setFromPoints(dome), floor: new THREE.BufferGeometry().setFromPoints(floor), architrave: new THREE.BufferGeometry().setFromPoints(ring(radius, height + 0.12, 128)) };
  }, [radius, height, count]);
  return (
    <group position={position}>
      <lineSegments geometry={g.pillarEdges}><lineBasicMaterial color={color} transparent opacity={0.7} /></lineSegments>
      <lineSegments geometry={g.beamEdges}><lineBasicMaterial color={color} transparent opacity={0.5} /></lineSegments>
      <lineSegments geometry={g.dome}><lineBasicMaterial color={color} transparent opacity={0.22} /></lineSegments>
      <lineSegments geometry={g.floor}><lineBasicMaterial color={color} transparent opacity={0.13} /></lineSegments>
    </group>
  );
}
