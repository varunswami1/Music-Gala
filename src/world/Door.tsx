import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
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
  size?: [number, number];        // height and width of the slit opening zone; the wall around it is derived from this
  accent?: string;
  cursorLabel?: string;
  onOpen: () => void;
}

/**
 * A way into another room: a dark wall slab with a tall glowing slit in it and light spilling onto the floor
 * (the "slit in a wall" of the reference). Click it and the camera flies through the slit. Used for every room-to-room link.
 */
export function Door({ label, sublabel, position, rotation = [0, 0, 0], size = [1.8, 2.8], accent = '#ffffff', cursorLabel = 'OPEN', onOpen }: DoorProps) {
  const { hover, bind } = useHover(cursorLabel);
  const ref = useRef<THREE.Group>(null), slit = useRef<THREE.Group>(null), spill = useRef<THREE.Mesh>(null);
  const [w0, h0] = size;
  const W = w0 * 1.9, H = h0 + 1.0, slitW = w0 * 0.2, slitH = h0;
  const slabEdges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(W, H, 0.3)), [W, H]);
  const grid = useMemo(() => {                                      // faint horizontal panel lines so the wall reads as architecture
    const pts: THREE.Vector3[] = [];
    for (const y of [0.35, h0 * 0.5, h0 + 0.35]) pts.push(new THREE.Vector3(-W / 2, y, 0.16), new THREE.Vector3(W / 2, y, 0.16));
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [W, h0]);
  const sideW = (W - slitW) / 2;
  useFrame(() => {
    const k = hover ? 2.4 : 1;
    if (slit.current) slit.current.scale.x = THREE.MathUtils.lerp(slit.current.scale.x, k, 0.14);
    if (spill.current) { spill.current.scale.x = THREE.MathUtils.lerp(spill.current.scale.x, hover ? 1.7 : 1, 0.12); (spill.current.material as THREE.MeshBasicMaterial).opacity = THREE.MathUtils.lerp((spill.current.material as THREE.MeshBasicMaterial).opacity, hover ? 0.3 : 0.14, 0.12); }
  });
  const fill = '#050505';
  return (
    <group ref={ref} position={position} rotation={rotation}>
      {/* the wall: left, right and lintel pieces (so the slit stays open), outlined as one slab */}
      <mesh position={[-(slitW + sideW) / 2, H / 2, 0.01]}><planeGeometry args={[sideW, H]} /><meshBasicMaterial color={fill} /></mesh>
      <mesh position={[(slitW + sideW) / 2, H / 2, 0.01]}><planeGeometry args={[sideW, H]} /><meshBasicMaterial color={fill} /></mesh>
      <mesh position={[0, slitH + (H - slitH) / 2, 0.01]}><planeGeometry args={[slitW, H - slitH]} /><meshBasicMaterial color={fill} /></mesh>
      <lineSegments geometry={slabEdges} position-y={H / 2}><lineBasicMaterial color={accent} transparent opacity={hover ? 0.95 : 0.6} /></lineSegments>
      <lineSegments geometry={grid}><lineBasicMaterial color={accent} transparent opacity={0.18} /></lineSegments>
      {/* the slit: a bright plane just behind the wall front, widening on hover */}
      <group ref={slit} position={[0, slitH / 2, -0.05]}>
        <mesh><planeGeometry args={[slitW, slitH]} /><meshBasicMaterial color={accent} toneMapped={false} /></mesh>
      </group>
      {/* light spilling out of the slit across the floor */}
      <mesh ref={spill} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 1.6]}>
        <planeGeometry args={[slitW * 4, 3.2]} /><meshBasicMaterial color={accent} transparent opacity={0.14} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* click target: the whole wall, so a thin slit is easy to hit */}
      <mesh {...bind} position={[0, H / 2, 0.2]} onClick={(e) => {
        e.stopPropagation();
        if (e.delta > 6) return;                                     // that was a drag to look around, not a click
        if (ref.current) { const v = new THREE.Vector3(); ref.current.getWorldPosition(v); v.y += slitH / 2; rememberDoor(v); }
        onOpen();
      }}>
        <planeGeometry args={[W, H]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      <Text position={[0, slitH + 0.5, 0.2]} fontSize={0.2} letterSpacing={0.15} color={accent}>{label}</Text>
      {sublabel && <Text position={[0, slitH + 0.22, 0.2]} fontSize={0.11} letterSpacing={0.1} color="#8a8a8a">{sublabel}</Text>}
    </group>
  );
}
