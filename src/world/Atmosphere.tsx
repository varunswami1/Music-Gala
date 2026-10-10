import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshReflectorMaterial, Stars } from '@react-three/drei';
import type * as THREE from 'three';
import { useApp } from '../store/app';

/** Slow dust motes. One draw call; positions are generated once from a fixed seed (same look every visit). */
function Dust({ count, animate }: { count: number; animate: boolean }) {
  const positions = useMemo(() => {
    const a = new Float32Array(count * 3);
    let s = 1337;
    const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < count; i++) {
      a[i * 3] = (r() - 0.5) * 44;
      a[i * 3 + 1] = r() * 10;
      a[i * 3 + 2] = (r() - 0.5) * 56 - 8;
    }
    return a;
  }, [count]);
  const ref = useRef<THREE.Points>(null);
  useFrame((state) => {
    if (!animate || !ref.current) return;
    const t = state.clock.elapsedTime;
    ref.current.position.y = Math.sin(t * 0.1) * 0.4;
    ref.current.position.x = Math.sin(t * 0.07) * 0.6;
  });
  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#cfd6ff" size={0.035} sizeAttenuation transparent opacity={0.45} depthWrite={false} />
    </points>
  );
}

/**
 * Shared background: stars, dust motes and a dark floor. Owner: Person 1.
 * Quality 'low' (touch devices, or when the FPS guard trips): no mirror floor, fewer particles.
 * Reduced motion: particles stand still.
 */
export function Atmosphere({ floor = true, size = 80 }: { floor?: boolean; size?: number }) {
  const quality = useApp((s) => s.quality);
  const reduced = useApp((s) => s.reducedMotion);
  const low = quality === 'low';
  return (
    <>
      <Stars radius={60} depth={40} count={low ? 600 : 1500} factor={3} fade speed={reduced ? 0 : 0.4} />
      <Dust count={low ? 250 : 700} animate={!reduced} />
      {floor && (
        <mesh rotation-x={-Math.PI / 2} position-y={0}>
          <planeGeometry args={[size, size]} />
          {low ? (
            <meshBasicMaterial color="#030303" />
          ) : (
            <MeshReflectorMaterial
              blur={[300, 100]} resolution={512} mixBlur={1} mixStrength={0.5} roughness={1}
              depthScale={1} minDepthThreshold={0.4} maxDepthThreshold={1.4} color="#050505" metalness={0.5} mirror={0}
            />
          )}
        </mesh>
      )}
    </>
  );
}
