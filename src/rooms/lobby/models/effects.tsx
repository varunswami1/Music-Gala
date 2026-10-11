// Small decorative pieces shared by the Lobby and Studio. Owner: Person 2.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { circleLines, gridLines, type V3 } from './build';
import { useReducedMotion } from './motion';

/** A flat circle outline on the floor (or at `position`). */
export function Ring({ radius, position = [0, 0.01, 0], segments = 64, color = '#ffffff', opacity = 0.3 }:
  { radius: number; position?: V3; segments?: number; color?: string; opacity?: number }) {
  const geo = useMemo(() => circleLines(segments), [segments]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <lineSegments geometry={geo} position={position} scale={[radius, 1, radius]}>
      <lineBasicMaterial color={color} transparent opacity={opacity} />
    </lineSegments>
  );
}

/** Rings that expand from a point and fade, like a sound wave. Static when reduced motion is on. */
export function FloorPulse({ position, count = 3, maxRadius = 6, period = 7, color = '#ffffff' }:
  { position: V3; count?: number; maxRadius?: number; period?: number; color?: string }) {
  const reduced = useReducedMotion();
  const geo = useMemo(() => circleLines(96), []);
  const refs = useRef<(THREE.LineSegments | null)[]>([]);
  useEffect(() => () => geo.dispose(), [geo]);
  useFrame((state) => {
    refs.current.forEach((l, i) => {
      if (!l) return;
      const p = reduced ? (i + 1) / (count + 1) : ((state.clock.elapsedTime / period) + i / count) % 1;
      l.scale.set(0.3 + p * maxRadius, 1, 0.3 + p * maxRadius);
      (l.material as THREE.LineBasicMaterial).opacity = (1 - p) * 0.45;
    });
  });
  return (
    <group position={position}>
      {Array.from({ length: count }, (_, i) => (
        <lineSegments key={i} ref={(el) => { refs.current[i] = el; }} geometry={geo}>
          <lineBasicMaterial color={color} transparent opacity={0.3} />
        </lineSegments>
      ))}
    </group>
  );
}

/**
 * A framed wall screen showing a calm equalizer (bars rise and fall slowly; still with reduced motion).
 * Borrowed idea: the lit wall screen in the reference pictures. The content is our own.
 */
export function EqualizerScreen({ position, rotation = [0, 0, 0], size = [4, 2], bars = 32, color = '#ffffff' }:
  { position: V3; rotation?: V3; size?: [number, number]; bars?: number; color?: string }) {
  const [w, h] = size;
  const reduced = useReducedMotion();
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const frame = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(w, h)), [w, h]);
  useEffect(() => () => frame.dispose(), [frame]);
  useFrame((state) => {
    const m = mesh.current;
    if (!m) return;
    const t = reduced ? 0 : state.clock.elapsedTime;
    for (let i = 0; i < bars; i++) {
      const k = 0.3 + 0.2 * Math.sin(t * 1.3 + i * 0.55) + 0.15 * Math.sin(t * 2.7 + i * 1.7);
      const bh = Math.min(0.9, Math.max(0.08, k)) * h * 0.8;
      dummy.position.set(-w / 2 + (i + 0.5) * (w / bars), -h / 2 + 0.08 * h + bh / 2, 0);
      dummy.scale.set((w / bars) * 0.45, bh, 1);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <group position={position} rotation={rotation}>
      <lineSegments geometry={frame}>
        <lineBasicMaterial color={color} transparent opacity={0.7} />
      </lineSegments>
      <instancedMesh ref={mesh} args={[undefined, undefined, bars]} frustumCulled={false}>
        <planeGeometry args={[1, 1]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}

/** Thin floor markings (a long aisle with cross lines). */
export function FloorGrid({ width, depth, cols, rows, position, opacity = 0.18 }:
  { width: number; depth: number; cols: number; rows: number; position: V3; opacity?: number }) {
  const geo = useMemo(() => gridLines(width, depth, cols, rows), [width, depth, cols, rows]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <lineSegments geometry={geo} position={position}>
      <lineBasicMaterial color="#ffffff" transparent opacity={opacity} />
    </lineSegments>
  );
}
