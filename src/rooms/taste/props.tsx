// Wireframe instruments and dot-cloud listeners for the Taste room. Everything is procedural (no assets) and drawn as thin lines on black,
// to match the rest of the gallery. Sizes are deliberately large: a piano about 4 m long, a violin about 3 m tall.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

type V3 = [number, number, number];

function Lines({ geo, color = '#ffffff', opacity = 0.85, ...rest }: { geo: THREE.BufferGeometry; color?: string; opacity?: number } & JSX.IntrinsicElements['lineSegments']) {
  return <lineSegments geometry={geo} {...rest}><lineBasicMaterial color={color} transparent opacity={opacity} /></lineSegments>;
}
const edges = (g: THREE.BufferGeometry, angle = 25) => new THREE.EdgesGeometry(g, angle);
const box = (w: number, h: number, d: number, x = 0, y = 0, z = 0) => { const g = new THREE.BoxGeometry(w, h, d); g.translate(x, y, z); return g; };

// ---------------------------------------------------------------- PIANO
/** Grand piano with the lid propped open, keyboard facing +z. Origin on the floor, centred under the keyboard. */
export function Piano({ position, rotation = [0, 0, 0], scale = 1.6, color = '#ffffff' }: { position: V3; rotation?: V3; scale?: number; color?: string }) {
  const g = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(-0.8, 0); shape.lineTo(0.8, 0); shape.lineTo(0.8, 1.1);
    shape.bezierCurveTo(0.8, 1.9, 0.6, 2.5, 0.0, 2.65); shape.lineTo(-0.8, 1.95); shape.lineTo(-0.8, 0);
    const body = new THREE.ExtrudeGeometry(shape, { depth: 0.24, bevelEnabled: false, curveSegments: 16 });
    body.rotateX(-Math.PI / 2); body.translate(0, 0.9, 0);                 // outline lies in the floor plane, extruded upwards; y -> -z
    const lid = body.clone(); lid.translate(0.8, -0.9, 0);                    // pivot about the left hinge edge later
    const keys: THREE.BufferGeometry[] = [];
    for (let i = 0; i < 20; i++) keys.push(box(0.065, 0.03, 0.42, -0.62 + i * 0.0655, 0.96, 0.24));
    for (let i = 0; i < 20; i++) if ([1, 2, 4, 5, 6].includes(i % 7)) keys.push(box(0.04, 0.04, 0.26, -0.62 + i * 0.0655 + 0.0325, 0.985, 0.17));
    const legs: THREE.BufferGeometry[] = [box(0.08, 0.9, 0.08, -0.72, 0.45, 0.1), box(0.08, 0.9, 0.08, 0.72, 0.45, 0.1), box(0.08, 0.9, 0.08, 0.1, 0.45, -2.0)];
    const bench = [box(0.9, 0.06, 0.38, 0, 0.5, 0.95), box(0.06, 0.5, 0.06, -0.38, 0.25, 0.8), box(0.06, 0.5, 0.06, 0.38, 0.25, 0.8), box(0.06, 0.5, 0.06, -0.38, 0.25, 1.1), box(0.06, 0.5, 0.06, 0.38, 0.25, 1.1)];
    return { body: edges(body, 20), lid: edges(lid, 20), keys: edges(mergeGeometries(keys)!, 10), legs: edges(mergeGeometries(legs)!), bench: edges(mergeGeometries(bench)!) };
  }, []);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Lines geo={g.body} color={color} /><Lines geo={g.keys} color={color} opacity={0.7} /><Lines geo={g.legs} color={color} opacity={0.6} /><Lines geo={g.bench} color={color} opacity={0.5} />
      <group position={[-0.8, 1.14, 0]} rotation={[0, 0, 0.45]}><Lines geo={g.lid} color={color} opacity={0.75} position={[-0.8, -0.24, 0]} /></group>
    </group>
  );
}

// ---------------------------------------------------------------- VIOLIN
/** Violin on a tripod stand, tilted back slightly, with a bow leaning beside it. About 3 m tall at the default scale. */
export function Violin({ position, rotation = [0, 0, 0], scale = 1.7, color = '#ffffff' }: { position: V3; rotation?: V3; scale?: number; color?: string }) {
  const g = useMemo(() => {
    const right = new THREE.SplineCurve([[0, -0.78], [0.25, -0.70], [0.37, -0.48], [0.30, -0.18], [0.20, 0.02], [0.27, 0.2], [0.31, 0.42], [0.22, 0.70], [0, 0.78]].map(([x, y]) => new THREE.Vector2(x, y))).getPoints(48);
    const left = right.slice().reverse().map((p) => new THREE.Vector2(-p.x, p.y)).slice(1, -1);
    const shape = new THREE.Shape([...right, ...left]);
    const body = new THREE.ExtrudeGeometry(shape, { depth: 0.14, bevelEnabled: false, curveSegments: 4 }); body.translate(0, 0, -0.07);
    const parts: THREE.BufferGeometry[] = [box(0.07, 0.9, 0.05, 0, 1.2, 0), box(0.1, 0.14, 0.06, 0, 1.72, 0), box(0.18, 0.02, 0.06, 0, -0.28, 0.1)];
    const scroll = new THREE.TorusGeometry(0.07, 0.015, 6, 14); scroll.translate(0.02, 1.85, 0);
    const strings = new THREE.BufferGeometry().setFromPoints([-0.025, -0.008, 0.008, 0.025].flatMap((x) => [new THREE.Vector3(x, -0.6, 0.09), new THREE.Vector3(x * 0.6, 1.7, 0.04)]));
    const fh = (s: number) => new THREE.BufferGeometry().setFromPoints(new THREE.SplineCurve([[0.14 * s, 0.05], [0.12 * s, -0.12], [0.15 * s, -0.3]].map(([x, y]) => new THREE.Vector2(x, y))).getPoints(10).flatMap((p, i, a) => (i ? [new THREE.Vector3(a[i - 1].x, a[i - 1].y, 0.075), new THREE.Vector3(p.x, p.y, 0.075)] : [])));
    const stand = new THREE.BufferGeometry().setFromPoints([[0, 0.35, 0, -0.55, 0, 0.5], [0, 0.35, 0, 0.55, 0, 0.5], [0, 0.35, 0, 0, 0, -0.6]].flatMap(([x0, y0, z0, x1, y1, z1]) => [new THREE.Vector3(x0, y0, z0), new THREE.Vector3(x1, y1, z1)]));
    const bow = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.05, 2.1, 0), new THREE.Vector3(0.02, 0.15, 0), new THREE.Vector3(0.05, 2.1, 0)]);
    return { body: edges(body, 12), neck: edges(mergeGeometries(parts)!), scroll, strings, fl: fh(1), fr: fh(-1), stand, bow, handle: edges(box(0.05, 0.22, 0.05, 0, 0.1, 0)) };
  }, []);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Lines geo={g.stand} color={color} opacity={0.6} />
      <group position={[0, 1.55, 0]} rotation={[-0.2, 0, 0]}>
        <Lines geo={g.body} color={color} /><Lines geo={g.neck} color={color} /><lineSegments geometry={g.scroll}><lineBasicMaterial color={color} transparent opacity={0.8} /></lineSegments>
        <lineSegments geometry={g.strings}><lineBasicMaterial color={color} transparent opacity={0.5} /></lineSegments>
        <lineSegments geometry={g.fl}><lineBasicMaterial color={color} transparent opacity={0.7} /></lineSegments>
        <lineSegments geometry={g.fr}><lineBasicMaterial color={color} transparent opacity={0.7} /></lineSegments>
      </group>
      <group position={[0.9, 0, 0.2]} rotation={[0, 0, -0.12]}>
        <lineSegments geometry={g.bow}><lineBasicMaterial color={color} transparent opacity={0.7} /></lineSegments><Lines geo={g.handle} color={color} />
      </group>
    </group>
  );
}

// ---------------------------------------------------------------- TURNTABLE
/** Record player on a table with a slowly spinning record. About 3.6 m wide at the default scale. */
export function Turntable({ position, rotation = [0, 0, 0], scale = 1.6, color = '#ffffff' }: { position: V3; rotation?: V3; scale?: number; color?: string }) {
  const record = useRef<THREE.Group>(null);
  useFrame((_, dt) => { if (record.current) record.current.rotation.y -= dt * 1.1; });
  const g = useMemo(() => {
    const table = [box(2.4, 0.08, 1.7, 0, 0.9, 0), ...[[-1.1, -0.75], [1.1, -0.75], [-1.1, 0.75], [1.1, 0.75]].map(([x, z]) => box(0.07, 0.9, 0.07, x, 0.45, z))];
    const plinth = box(2.2, 0.22, 1.5, 0, 1.05, 0);
    const platter = new THREE.CylinderGeometry(0.72, 0.72, 0.06, 40); platter.translate(0, 1.19, 0);
    const ring = (r: number) => new THREE.BufferGeometry().setFromPoints(Array.from({ length: 49 }, (_, i) => new THREE.Vector3(Math.cos((i / 48) * 6.2832) * r, 1.235, Math.sin((i / 48) * 6.2832) * r)));
    const arm = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0.95, 1.2, -0.55), new THREE.Vector3(0.95, 1.5, -0.55), new THREE.Vector3(0.38, 1.5, 0.2), new THREE.Vector3(0.3, 1.27, 0.28)]);
    const pivot = new THREE.CylinderGeometry(0.1, 0.1, 0.35, 12); pivot.translate(0.95, 1.3, -0.55);
    return { table: edges(mergeGeometries(table)!), plinth: edges(plinth), platter: edges(platter, 30), rings: [0.2, 0.32, 0.43, 0.54, 0.62, 0.69].map(ring), label: ring(0.14), spindle: edges(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 6).translate(0, 1.28, 0)), arm, pivot: edges(pivot, 30) };
  }, []);
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <Lines geo={g.table} color={color} opacity={0.6} /><Lines geo={g.plinth} color={color} /><Lines geo={g.pivot} color={color} opacity={0.7} />
      <group ref={record}>
        <Lines geo={g.platter} color={color} />
        {g.rings.map((r, i) => <lineSegments key={i} geometry={r}><lineBasicMaterial color={color} transparent opacity={0.35 + (i % 2) * 0.25} /></lineSegments>)}
        <lineSegments geometry={g.label}><lineBasicMaterial color={color} transparent opacity={0.9} /></lineSegments><Lines geo={g.spindle} color={color} />
        <Lines geo={edges(box(0.5, 0.004, 0.06, 0.4, 1.238, 0))} color={color} opacity={0.4} />
      </group>
      <lineSegments geometry={g.arm}><lineBasicMaterial color={color} transparent opacity={0.9} /></lineSegments>
    </group>
  );
}

// ---------------------------------------------------------------- DOT-CLOUD PEOPLE
type Seg = [number, number, number, number, number, number, number]; // x0 y0 z0 x1 y1 z1 radius
function personSegments(pose: 'stand' | 'sit' | 'headphones'): Seg[] {
  const sit = pose === 'sit';
  const hipY = sit ? 0.52 : 0.95;
  const segs: Seg[] = [
    [0, hipY, 0, 0, hipY + 0.5, 0, 0.17],                                        // torso
    [0, hipY + 0.5, 0, 0, hipY + 0.62, 0, 0.06],                                 // neck
    [0, hipY + 0.78, 0, 0, hipY + 0.78, 0, 0.12],                                // head
  ];
  if (sit) {
    segs.push([-0.1, hipY, 0, -0.1, hipY, 0.45, 0.08], [0.1, hipY, 0, 0.1, hipY, 0.45, 0.08], [-0.1, hipY, 0.45, -0.1, 0.05, 0.5, 0.06], [0.1, hipY, 0.45, 0.1, 0.05, 0.5, 0.06]);
    segs.push([-0.2, hipY + 0.45, 0, -0.22, hipY + 0.2, 0.3, 0.05], [-0.22, hipY + 0.2, 0.3, -0.18, hipY + 0.2, 0.62, 0.04], [0.2, hipY + 0.45, 0, 0.22, hipY + 0.2, 0.3, 0.05], [0.22, hipY + 0.2, 0.3, 0.18, hipY + 0.2, 0.62, 0.04]);
  } else {
    segs.push([-0.1, hipY, 0, -0.1, 0.5, 0.02, 0.08], [0.1, hipY, 0, 0.1, 0.5, 0.02, 0.08], [-0.1, 0.5, 0.02, -0.1, 0.04, 0, 0.06], [0.1, 0.5, 0.02, 0.1, 0.04, 0, 0.06]);
    segs.push([-0.2, hipY + 0.45, 0, -0.25, hipY + 0.1, 0.05, 0.05], [-0.25, hipY + 0.1, 0.05, -0.24, hipY - 0.2, 0.1, 0.04]);
    if (pose === 'headphones') segs.push([0.2, hipY + 0.45, 0, 0.3, hipY + 0.7, 0.1, 0.05], [0.3, hipY + 0.7, 0.1, 0.16, hipY + 0.82, 0.04, 0.04], [-0.14, hipY + 0.78, 0, -0.14, hipY + 0.78, 0, 0.04]);
    else segs.push([0.2, hipY + 0.45, 0, 0.25, hipY + 0.1, 0.05, 0.05], [0.25, hipY + 0.1, 0.05, 0.24, hipY - 0.2, 0.1, 0.04]);
  }
  return segs;
}

function sampleCloud(segs: Seg[], perUnit: number, seed: number) {
  let s = seed; const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  const pts: number[] = [];
  for (const [x0, y0, z0, x1, y1, z1, r] of segs) {
    const len = Math.hypot(x1 - x0, y1 - y0, z1 - z0), n = Math.max(30, Math.round((len * r * 6 + r * r * 14) * perUnit));
    for (let i = 0; i < n; i++) {
      const t = rnd(), th = rnd() * 6.2832, ph = Math.acos(2 * rnd() - 1);
      pts.push(x0 + (x1 - x0) * t + r * Math.sin(ph) * Math.cos(th), y0 + (y1 - y0) * t + r * Math.cos(ph), z0 + (z1 - z0) * t + r * Math.sin(ph) * Math.sin(th));
    }
  }
  return new Float32Array(pts);
}

/** A person made of points, swaying slightly as if listening. Faces +z by default; rotate with `rotation`. */
export function DotPerson({ position, rotation = [0, 0, 0], scale = 1.25, pose = 'stand', seed = 7, phase = 0 }: { position: V3; rotation?: V3; scale?: number; pose?: 'stand' | 'sit' | 'headphones'; seed?: number; phase?: number }) {
  const geo = useMemo(() => { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(sampleCloud(personSegments(pose), 150, seed * 977 + 13), 3)); return g; }, [pose, seed]);
  const grp = useRef<THREE.Group>(null);
  const mat = useRef<THREE.PointsMaterial>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + phase;
    if (grp.current) { grp.current.rotation.z = Math.sin(t * 0.9) * 0.025; grp.current.position.y = Math.sin(t * 1.8) * 0.012; grp.current.rotation.x = pose === 'headphones' ? Math.sin(t * 3.6) * 0.02 : 0; }
    if (mat.current) mat.current.opacity = 0.7 + Math.sin(t * 2.2) * 0.12;
  });
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <group ref={grp}><points geometry={geo}><pointsMaterial ref={mat} color="#e8e8e8" size={0.026} sizeAttenuation transparent opacity={0.8} depthWrite={false} /></points></group>
    </group>
  );
}
