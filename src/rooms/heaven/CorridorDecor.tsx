// Things that make the corridor feel like a place and not empty space: pillars with light strips, dotted people walking,
// and small frames hanging from the ceiling. Everything is deterministic per slot index and only mounted near the camera. Owner: Person 3.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CoverCollage } from './CoverCollage';
import { prefersReducedMotion } from './motion';

export const DECOR_H = 7.5;            // corridor height
const PILLAR_X = 7.3;
const TAU = Math.PI * 2;
const rnd = (i: number, n: number) => { const x = Math.sin(i * 127.1 + n * 311.7) * 43758.5453; return x - Math.floor(x); };

// ---- a person made of points (dotted silhouette), about 1.75 high, facing +z ----
function makePerson(): THREE.BufferGeometry {
  let seed = 7; const r = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const p: number[] = [];
  const ell = (cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, n: number) => {
    for (let i = 0; i < n; i++) { const u = r() * 2 - 1, a = r() * TAU, s = Math.sqrt(1 - u * u); p.push(cx + rx * s * Math.cos(a), cy + ry * u, cz + rz * s * Math.sin(a)); }
  };
  const limb = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, rad: number, n: number) => {
    for (let i = 0; i < n; i++) { const t = r(); p.push(x0 + (x1 - x0) * t + (r() - 0.5) * rad * 2, y0 + (y1 - y0) * t + (r() - 0.5) * rad, z0 + (z1 - z0) * t + (r() - 0.5) * rad * 2); }
  };
  ell(0, 1.68, 0, 0.1, 0.12, 0.1, 46);          // head
  limb(0, 1.52, 0, 0, 1.58, 0, 0.03, 6);        // neck
  ell(0, 1.22, 0, 0.2, 0.32, 0.11, 110);        // torso
  ell(0, 0.92, 0, 0.17, 0.12, 0.1, 30);         // pelvis
  for (const s of [-1, 1]) limb(s * 0.23, 1.42, 0, s * 0.3, 0.86, 0.04, 0.045, 30);   // arms
  for (const s of [-1, 1]) limb(s * 0.1, 0.92, 0, s * 0.12, 0.04, 0, 0.05, 40);       // legs
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
  return g;
}
const PERSON = makePerson();
const PERSON_MAT = new THREE.PointsMaterial({ size: 0.045, color: '#ffffff', transparent: true, opacity: 0.8, depthWrite: false });

function Walker({ x, z, sp, ph, range, s }: { x: number; z: number; sp: number; ph: number; range: number; s: number }) {
  const g = useRef<THREE.Group>(null);
  const reduce = useRef(prefersReducedMotion());
  useFrame(({ clock }) => {
    const o = g.current; if (!o) return;
    const t = reduce.current ? ph : clock.elapsedTime * sp + ph;
    o.position.z = z + Math.sin(t) * range;
    o.position.y = Math.abs(Math.sin(t * 7)) * 0.03;                 // footfall bob
    o.rotation.y = Math.cos(t) > 0 ? 0 : Math.PI;                    // face the way they walk
  });
  return <group ref={g} position={[x, 0, z]} scale={s}><points geometry={PERSON} material={PERSON_MAT} /></group>;
}

// ---- pillar with a vertical light strip on its inner face ----
const PILLAR_EDGES = (() => { const g = new THREE.BoxGeometry(0.6, DECOR_H, 0.6); g.translate(0, DECOR_H / 2, 0); return new THREE.EdgesGeometry(g); })();
const STRIP = new THREE.PlaneGeometry(0.06, DECOR_H * 0.86);
const STRIP_MAT = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.85, side: THREE.DoubleSide });

function Pillar({ side, z }: { side: -1 | 1; z: number }) {
  return (
    <group position={[side * PILLAR_X, 0, z]}>
      <lineSegments geometry={PILLAR_EDGES}><lineBasicMaterial color="#ffffff" transparent opacity={0.35} /></lineSegments>
      <mesh geometry={STRIP} material={STRIP_MAT} position={[-side * 0.34, DECOR_H * 0.5, 0]} rotation={[0, Math.PI / 2, 0]} raycast={() => null} />
    </group>
  );
}

// ---- small frame hung from the ceiling on two cables (decoration, not clickable) ----
const FRAME_SIZE = 1.5;
const AMB_FRAME = new THREE.EdgesGeometry(new THREE.PlaneGeometry(FRAME_SIZE + 0.08, FRAME_SIZE + 0.08));
function AmbientFrame({ x, y, z, ry, url }: { x: number; y: number; z: number; ry: number; url: string | null }) {
  const cable = useMemo(() => {
    const g = new THREE.BufferGeometry(); const h = DECOR_H - y; const a = FRAME_SIZE / 2;
    g.setAttribute('position', new THREE.Float32BufferAttribute([-a, FRAME_SIZE / 2, 0, -a * 0.3, h, 0, a, FRAME_SIZE / 2, 0, a * 0.3, h, 0], 3));
    return g;
  }, [y]);
  useEffect(() => () => cable.dispose(), [cable]);
  return (
    <group position={[x, y, z]} rotation={[0, ry, 0]}>
      <CoverCollage covers={[url]} grid={1} size={FRAME_SIZE} />
      <lineSegments geometry={AMB_FRAME} position-z={0.01}><lineBasicMaterial color="#ffffff" transparent opacity={0.5} /></lineSegments>
      <lineSegments geometry={cable}><lineBasicMaterial color="#ffffff" transparent opacity={0.25} /></lineSegments>
    </group>
  );
}

/** Everything around one stretch of corridor, centred on `zc` (between two gates). `i` is the slot index. */
export function Decor({ i, zc, ambient }: { i: number; zc: number; ambient: string[] }) {
  const walkers = 1 + Math.floor(rnd(i, 1) * 2.2);
  return (
    <group>
      <Pillar side={-1} z={zc} /><Pillar side={1} z={zc} />
      {Array.from({ length: walkers }, (_, j) => (
        <Walker key={j} x={(rnd(i, 10 + j) - 0.5) * 9} z={zc + (rnd(i, 20 + j) - 0.5) * 4} sp={0.25 + rnd(i, 30 + j) * 0.3}
          ph={rnd(i, 40 + j) * TAU} range={2 + rnd(i, 50 + j) * 2.5} s={0.95 + rnd(i, 60 + j) * 0.15} />
      ))}
      {[0, 1].map((j) => (
        <AmbientFrame key={j} x={(j ? 1 : -1) * (1.6 + rnd(i, 70 + j) * 1.6)} y={3.6 + rnd(i, 80 + j) * 1.4} z={zc + (rnd(i, 90 + j) - 0.5) * 3}
          ry={(rnd(i, 100 + j) - 0.5) * 0.9} url={ambient.length ? ambient[(i * 2 + j) % ambient.length] : null} />
      ))}
    </group>
  );
}
