// A picture frame hung from the ceiling by two cables, showing a cover collage. Owner: Person 3.
// Used by Heaven (4 areas), Library (one per scene room) and Playlists (one per playlist).
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useHover } from '../../world/useHover';
import { CoverCollage } from './CoverCollage';
import { prefersReducedMotion } from './motion';

type V3 = [number, number, number];
interface HangingFrameProps {
  label: string;
  sublabel?: string;
  position: V3;          // centre of the picture
  ceilingY: number;      // world y the cables are tied to
  covers?: (string | null)[];
  grid?: number;
  size?: number;
  accent?: string;
  cursorLabel?: string;
  onOpen: () => void;
}

export function HangingFrame({ label, sublabel, position, ceilingY, covers = [], grid = 2, size = 2.4, accent = '#ffffff', cursorLabel = 'OPEN', onOpen }: HangingFrameProps) {
  const { hover, bind } = useHover(cursorLabel);
  const sway = useRef<THREE.Group>(null);
  const pop = useRef<THREE.Group>(null);
  const [reduce] = useState(prefersReducedMotion);
  const phase = position[0] * 1.7 + position[1];

  const frameGeo = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(size + 0.12, size + 0.12)), [size]);
  const cableGeo = useMemo(() => {
    const h = ceilingY - position[1];
    const x = size / 2;
    return new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-x, size / 2 + 0.06, 0), new THREE.Vector3(-x * 0.3, h, 0),
      new THREE.Vector3(x, size / 2 + 0.06, 0), new THREE.Vector3(x * 0.3, h, 0),
    ]);
  }, [ceilingY, position[1], size]);
  useEffect(() => () => frameGeo.dispose(), [frameGeo]);
  useEffect(() => () => cableGeo.dispose(), [cableGeo]);

  useFrame(({ clock }) => {
    if (sway.current && !reduce) sway.current.rotation.y = Math.sin(clock.elapsedTime * 0.4 + phase) * 0.025;
    if (pop.current) {
      const k = hover ? 1 : 0;
      pop.current.position.z = THREE.MathUtils.lerp(pop.current.position.z, k * 0.25, 0.12);
      pop.current.scale.setScalar(THREE.MathUtils.lerp(pop.current.scale.x, 1 + k * 0.04, 0.12));
    }
  });

  return (
    <group position={position}>
      <group ref={sway}>
        <lineSegments geometry={cableGeo}><lineBasicMaterial color="#ffffff" transparent opacity={0.3} /></lineSegments>
        <group ref={pop}>
          <CoverCollage covers={covers} grid={grid} size={size} hover={hover} />
          <lineSegments geometry={frameGeo} position-z={0.01}>
            <lineBasicMaterial color={accent} transparent opacity={hover ? 1 : 0.7} />
          </lineSegments>
          <mesh {...bind} position-z={0.03} onClick={(e) => { e.stopPropagation(); onOpen(); }}>
            <planeGeometry args={[size + 0.12, size + 0.12]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          <Text position={[0, -size / 2 - 0.22, 0.02]} fontSize={0.19} letterSpacing={0.15} color={accent} anchorY="top">{label}</Text>
          {sublabel && <Text position={[0, -size / 2 - 0.52, 0.02]} fontSize={0.1} letterSpacing={0.12} color="#8a8a8a" anchorY="top">{sublabel}</Text>}
        </group>
      </group>
    </group>
  );
}
