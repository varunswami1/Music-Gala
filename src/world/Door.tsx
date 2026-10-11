import { useEffect, useMemo, useRef } from 'react';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useHover } from './useHover';
import { rememberDoor } from './transition';

/** Yaw that makes something at (x, z) face the point (tx, tz). Use for doors placed around the room. */
export const faceTowards = (x: number, z: number, tx = 0, tz = 0) => Math.atan2(tx - x, tz - z);

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

/** A glowing doorway frame with two bright posts. Clicking it navigates with transition. */
export function Door({ label, sublabel, position, rotation = [0, 0, 0], size = [1.8, 2.8], accent = '#ffffff', cursorLabel = 'OPEN', onOpen }: DoorProps) {
  const { hover, bind } = useHover(cursorLabel, onOpen, sublabel ? `${label}: ${sublabel}` : label);
  const ref = useRef<THREE.Group>(null);
  const frame = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(size[0], size[1])), [size[0], size[1]]);
  useEffect(() => () => frame.dispose(), [frame]);
  const barW = 0.05;

  return (
    <group ref={ref} position={position} rotation={rotation}>
      <mesh
        {...bind}
        position-y={size[1] / 2}
        onClick={(e) => {
          e.stopPropagation();
          if ((e as any).delta > 6) return; // ignore drags meant for look-around
          if (ref.current) {
            const v = new THREE.Vector3();
            ref.current.getWorldPosition(v);
            v.y += size[1] / 2;
            rememberDoor(v);
          }
          onOpen();
        }}
      >
        <planeGeometry args={size} />
        <meshBasicMaterial color={accent} transparent opacity={hover ? 0.22 : 0.05} depthWrite={false} />
      </mesh>
      <lineSegments geometry={frame} position-y={size[1] / 2}>
        <lineBasicMaterial color="#ffffff" transparent opacity={hover ? 1 : 0.55} />
      </lineSegments>
      {/* two bright posts, like the doors in the architectural reference */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (size[0] / 2), size[1] / 2, 0.01]}>
          <planeGeometry args={[barW, size[1]]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={hover ? 1 : 0.8} />
        </mesh>
      ))}
      <Text position={[0, size[1] + 0.3, 0.02]} fontSize={0.2} letterSpacing={0.15} color="#ffffff">
        {label}
      </Text>
      {sublabel && (
        <Text position={[0, size[1] + 0.02, 0.02]} fontSize={0.11} letterSpacing={0.1} color="#8a8a8a">
          {sublabel}
        </Text>
      )}
    </group>
  );
}
