import { useEffect, useMemo } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useHover } from './useHover';

type V3 = [number, number, number];
interface DoorProps {
  label: string;
  sublabel?: string;
  position: V3;
  rotation?: V3;
  size?: [number, number];
  accent?: string;
  cursorLabel?: string;
  onOpen: () => void;
}

/** A glowing doorway frame. Clicking it (or Tab + Enter) navigates. Used for every room-to-room link. Props are stable: do not rename. */
export function Door({ label, sublabel, position, rotation = [0, 0, 0], size = [1.8, 2.8], accent = '#ffffff', cursorLabel = 'OPEN', onOpen }: DoorProps) {
  const { hover, bind } = useHover(cursorLabel, onOpen, sublabel ? `${label}: ${sublabel}` : label);
  const frame = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(size[0], size[1])), [size[0], size[1]]);
  useEffect(() => () => frame.dispose(), [frame]);
  return (
    <group position={position} rotation={rotation}>
      <mesh {...bind} position-y={size[1] / 2} onClick={(e) => { e.stopPropagation(); onOpen(); }}>
        <planeGeometry args={size} />
        <meshBasicMaterial color={accent} transparent opacity={hover ? 0.28 : 0.1} depthWrite={false} />
      </mesh>
      <lineSegments geometry={frame} position-y={size[1] / 2}>
        <lineBasicMaterial color={accent} transparent opacity={hover ? 1 : 0.7} />
      </lineSegments>
      <Text position={[0, size[1] + 0.3, 0.02]} fontSize={0.2} letterSpacing={0.15} color={accent}>{label}</Text>
      {sublabel && <Text position={[0, size[1] + 0.02, 0.02]} fontSize={0.11} letterSpacing={0.1} color="#8a8a8a">{sublabel}</Text>}
    </group>
  );
}
