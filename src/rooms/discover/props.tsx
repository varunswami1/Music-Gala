// Wireframe props for the Discover room: headphones, boombox, cassette, armillary globe. Procedural, thin lines, deliberately large.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

type V3 = [number, number, number];
const edges = (g: THREE.BufferGeometry, a = 25) => new THREE.EdgesGeometry(g, a);
const loop = (r: number, seg = 48, plane: 'xy' | 'xz' | 'yz' = 'xy', z = 0) => new THREE.BufferGeometry().setFromPoints(Array.from({ length: seg + 1 }, (_, i) => {
  const a = (i / seg) * Math.PI * 2, c = Math.cos(a) * r, s = Math.sin(a) * r;
  return plane === 'xy' ? new THREE.Vector3(c, s, z) : plane === 'xz' ? new THREE.Vector3(c, z, s) : new THREE.Vector3(z, c, s);
}));
function L({ geo, o = 0.85, c = '#ffffff', ...rest }: { geo: THREE.BufferGeometry; o?: number; c?: string } & JSX.IntrinsicElements['lineSegments']) {
  return <lineSegments geometry={geo} {...rest}><lineBasicMaterial color={c} transparent opacity={o} /></lineSegments>;
}
function Ln({ geo, o = 0.85, c = '#ffffff', position }: { geo: THREE.BufferGeometry; o?: number; c?: string; position?: V3 }) {
  const obj = useMemo(() => new THREE.Line(geo, new THREE.LineBasicMaterial({ color: c, transparent: true, opacity: o })), [geo, c, o]);
  return <primitive object={obj} position={position} />;
}

/** Over-ear headphones on a stand, about 3.4 m tall at the default scale. */
export function Headphones({ position, rotation = [0, 0, 0], scale = 1.6 }: { position: V3; rotation?: V3; scale?: number }) {
  const g = useMemo(() => {
    const band = new THREE.TorusGeometry(0.62, 0.035, 6, 36, Math.PI); band.translate(0, 1.55, 0);
    const pad = new THREE.TorusGeometry(0.58, 0.02, 4, 40, Math.PI); pad.translate(0, 1.55, 0);
    const cup = (s: number) => { const c = new THREE.CylinderGeometry(0.32, 0.32, 0.2, 24); c.rotateZ(Math.PI / 2); c.translate(s * 0.64, 1.0, 0); const cu = new THREE.TorusGeometry(0.26, 0.04, 6, 24); cu.rotateY(Math.PI / 2); cu.translate(s * 0.52, 1.0, 0); return [c, cu]; };
    const stand = [new THREE.CylinderGeometry(0.04, 0.04, 1.05, 8).translate(0, 0.52, 0), new THREE.CylinderGeometry(0.4, 0.46, 0.08, 20).translate(0, 0.04, 0)];
    return { band: edges(mergeGeometries([band, pad])!, 40), cups: edges(mergeGeometries([...cup(-1), ...cup(1)])!, 40), stand: edges(mergeGeometries(stand)!, 40) };
  }, []);
  return <group position={position} rotation={rotation} scale={scale}><L geo={g.band} /><L geo={g.cups} /><L geo={g.stand} o={0.55} /></group>;
}

/** Boombox on a low table: two speakers, tape deck, handle, antenna. About 3 m wide at the default scale. */
export function Boombox({ position, rotation = [0, 0, 0], scale = 1.3 }: { position: V3; rotation?: V3; scale?: number }) {
  const g = useMemo(() => {
    const body = new THREE.BoxGeometry(2.4, 1.1, 0.7).translate(0, 1.05, 0);
    const table = [new THREE.BoxGeometry(2.8, 0.08, 1.1).translate(0, 0.46, 0), ...[[-1.3, -0.45], [1.3, -0.45], [-1.3, 0.45], [1.3, 0.45]].map(([x, z]) => new THREE.BoxGeometry(0.07, 0.46, 0.07).translate(x, 0.23, z))];
    const deck = new THREE.BoxGeometry(0.9, 0.34, 0.02).translate(0, 1.3, 0.36), tune = new THREE.BoxGeometry(0.9, 0.08, 0.02).translate(0, 0.85, 0.36);
    const handle = new THREE.TorusGeometry(0.9, 0.04, 5, 30, Math.PI); handle.translate(0, 1.6, 0);
    const knobs = [-0.3, 0, 0.3].map((x) => new THREE.CylinderGeometry(0.07, 0.07, 0.05, 10).rotateX(Math.PI / 2).translate(x, 0.95, 0.38));
    const ant = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(1.0, 1.6, 0), new THREE.Vector3(1.9, 2.9, -0.1)]);
    return { body: edges(body), table: edges(mergeGeometries(table)!), deck: edges(mergeGeometries([deck, tune, ...knobs])!, 20), handle: edges(handle, 40), ant, sp: [-0.82, 0.82].map((x) => [0.15, 0.3, 0.45].map((r) => loop(r, 32, 'xy', 0.36)).map((l) => ({ l, x }))).flat() };
  }, []);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <L geo={g.body} /><L geo={g.table} o={0.55} /><L geo={g.deck} o={0.8} /><L geo={g.handle} o={0.8} />
      <Ln geo={g.ant} o={0.8} position={[0, 0, 0]} />
      {g.sp.map(({ l, x }, i) => <Ln key={i} geo={l} o={0.6} position={[x, 1.05, 0]} />)}
    </group>
  );
}

/** A standing cassette tape, leaning, with turning reels. About 2.7 m tall at the default scale. */
export function Cassette({ position, rotation = [0, 0, 0], scale = 1.9 }: { position: V3; rotation?: V3; scale?: number }) {
  const reels = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (reels.current) reels.current.children.forEach((c) => { c.rotation.z -= dt * 1.2; }); });
  const g = useMemo(() => {
    const body = new THREE.BoxGeometry(1.7, 1.1, 0.12), win = new THREE.BoxGeometry(1.0, 0.36, 0.13).translate(0, 0.05, 0), label = new THREE.BoxGeometry(1.45, 0.4, 0.125).translate(0, 0.35, 0), foot = new THREE.BoxGeometry(1.0, 0.18, 0.13).translate(0, -0.46, 0);
    const spoke = (n: number) => new THREE.BufferGeometry().setFromPoints(Array.from({ length: n * 2 }, (_, i) => (i % 2 ? new THREE.Vector3(Math.cos((i >> 1) / n * 6.283) * 0.16, Math.sin((i >> 1) / n * 6.283) * 0.16, 0) : new THREE.Vector3(0, 0, 0))));
    return { body: edges(body), inner: edges(mergeGeometries([win, label, foot])!, 20), ring: loop(0.2, 24), hub: loop(0.07, 12), spoke: spoke(6) };
  }, []);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group position={[0, 0.6, 0]} rotation={[-0.18, 0, 0.1]}>
        <L geo={g.body} /><L geo={g.inner} o={0.65} />
        <group ref={reels}>{[-0.35, 0.35].map((x) => (
          <group key={x} position={[x, 0.05, 0.08]}><Ln geo={g.ring} o={0.8} /><Ln geo={g.hub} o={0.8} /><L geo={g.spoke} o={0.8} /></group>
        ))}</group>
      </group>
    </group>
  );
}

/** Armillary sphere (a globe made of rings) turning slowly above a plinth: the "discover" icon. About 3.5 m tall. */
export function Armillary({ position, scale = 1.6 }: { position: V3; scale?: number }) {
  const sphere = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (sphere.current) sphere.current.rotation.y += dt * 0.35; });
  const g = useMemo(() => ({
    eq: loop(1.0, 72, 'xz'), m1: loop(1.0, 72, 'xy'), m2: loop(1.0, 72, 'yz'), tropic: loop(0.8, 56, 'xz', 0.6), tropic2: loop(0.8, 56, 'xz', -0.6),
    axis: new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, -1.35, 0), new THREE.Vector3(0, 1.35, 0)]),
    plinth: edges(mergeGeometries([new THREE.CylinderGeometry(0.7, 0.8, 0.12, 24).translate(0, 0.06, 0), new THREE.CylinderGeometry(0.18, 0.18, 1.0, 12).translate(0, 0.62, 0), new THREE.CylinderGeometry(0.5, 0.18, 0.1, 18).translate(0, 1.17, 0)])!, 30),
    core: edges(new THREE.IcosahedronGeometry(0.22, 1), 1),
  }), []);
  return (
    <group position={position} scale={scale}>
      <L geo={g.plinth} o={0.7} />
      <group position={[0, 2.35, 0]} rotation={[0, 0, 0.41]}><group ref={sphere}>
        <Ln geo={g.eq} /><Ln geo={g.m1} o={0.7} /><Ln geo={g.m2} o={0.7} /><Ln geo={g.tropic} o={0.5} /><Ln geo={g.tropic2} o={0.5} /><Ln geo={g.axis} o={0.8} /><L geo={g.core} o={0.9} />
      </group></group>
    </group>
  );
}
