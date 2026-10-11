// Renders one procedural model as a wireframe, a point cloud, or both. Owner: Person 2.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BUILDERS, type ModelKind } from './instruments';
import { samplePoints, type V3 } from './build';
import { useReducedMotion } from './motion';

interface ModelProps {
  kind: ModelKind;
  position?: V3;
  rotation?: V3;
  scale?: number | V3;
  /** Draw the outline (default true). */
  wire?: boolean;
  wireOpacity?: number;
  /** Number of surface points to draw (0 = none). */
  points?: number;
  pointSize?: number;
  color?: string;
  pointColor?: string;
  seed?: number;
  /** Radians per second of slow spin (ignored with reduced motion). */
  spin?: number;
  /** Radians of gentle side-to-side sway (ignored with reduced motion). */
  sway?: number;
  phase?: number;
  /** Edge angle in degrees: smaller draws more lines on curved parts. */
  edgeAngle?: number;
  /** Metres of gentle up-and-down floating (ignored with reduced motion). */
  bob?: number;
  /** Let scene fog fade this model (default true). Turn off for things that must stay visible from far away. */
  fog?: boolean;
}

export function Model({
  kind, position = [0, 0, 0], rotation = [0, 0, 0], scale = 1, wire = true, wireOpacity = 0.5,
  points = 0, pointSize = 0.02, color = '#ffffff', pointColor, seed = 1, spin = 0, sway = 0, phase = 0, edgeAngle = 20, bob = 0, fog = true,
}: ModelProps) {
  const reduced = useReducedMotion();
  const group = useRef<THREE.Group>(null);

  const built = useMemo(() => {
    const src = BUILDERS[kind]();
    const edges = wire ? new THREE.EdgesGeometry(src, edgeAngle) : null;
    let pts: THREE.BufferGeometry | null = null;
    if (points > 0) {
      pts = new THREE.BufferGeometry();
      pts.setAttribute('position', new THREE.BufferAttribute(samplePoints(src, points, seed), 3));
    }
    src.dispose();
    return { edges, pts };
  }, [kind, wire, points, seed, edgeAngle]);

  useEffect(() => () => { built.edges?.dispose(); built.pts?.dispose(); }, [built]);

  useFrame((state) => {
    const g = group.current;
    if (!g || reduced || (spin === 0 && sway === 0 && bob === 0)) return;
    const t = state.clock.elapsedTime;
    g.rotation.y = rotation[1] + spin * t + sway * Math.sin(t * 0.5 + phase);
    if (bob !== 0) g.position.y = position[1] + bob * Math.sin(t * 0.9 + phase);
  });

  return (
    <group ref={group} position={position} rotation={rotation} scale={scale}>
      {built.edges && (
        <lineSegments geometry={built.edges}>
          <lineBasicMaterial color={color} transparent opacity={wireOpacity} fog={fog} />
        </lineSegments>
      )}
      {built.pts && (
        <points geometry={built.pts}>
          <pointsMaterial color={pointColor ?? color} size={pointSize} sizeAttenuation transparent opacity={0.85} depthWrite={false} fog={fog} />
        </points>
      )}
    </group>
  );
}
