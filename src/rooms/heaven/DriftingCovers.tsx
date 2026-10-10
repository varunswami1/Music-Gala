// Small covers floating slowly in the background of Heaven. Decorative: no pointer events, no text. Owner: Person 3.
import { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useCover } from '../../world/Poster';
import { prefersReducedMotion } from './motion';

const rnd = (i: number, n: number) => { const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453; return x - Math.floor(x); };

function Drifter({ url, i, reduce }: { url: string; i: number; reduce: boolean }) {
  const tex = useCover(url);
  const ref = useRef<THREE.Group>(null);
  const b = useMemo(() => ({
    x: (rnd(i, 1) - 0.5) * 16, y: 1.2 + rnd(i, 2) * 4.2, z: -13 - rnd(i, 3) * 16,
    s: 0.7 + rnd(i, 4) * 0.5, ph: rnd(i, 5) * 6.28, sp: 0.15 + rnd(i, 6) * 0.25,
  }), [i]);
  useFrame(({ clock }) => {
    if (!ref.current || reduce) return;
    const t = clock.elapsedTime * b.sp + b.ph;
    ref.current.position.y = b.y + Math.sin(t) * 0.35;
    ref.current.rotation.y = Math.sin(t * 0.7) * 0.4;
  });
  if (!tex) return null;
  return (
    <group ref={ref} position={[b.x, b.y, b.z]}>
      <mesh raycast={() => null}>
        <planeGeometry args={[b.s, b.s]} />
        <meshBasicMaterial map={tex} transparent opacity={0.55} side={THREE.DoubleSide} depthWrite={false} />
      </mesh>
    </group>
  );
}

export function DriftingCovers({ urls }: { urls: string[] }) {
  const [reduce] = useState(prefersReducedMotion);
  return <>{urls.map((u, i) => <Drifter key={`${i}-${u}`} url={u} i={i} reduce={reduce} />)}</>;
}
