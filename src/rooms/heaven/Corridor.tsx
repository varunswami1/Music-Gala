// A long corridor you walk down with the keyboard. Each room is a big GATE on alternating sides, so it feels like 3D space:
// far gates are dark and quiet, close ones reveal their details, and clicking one enters it through the tunnel. Owner: Person 3.
// Controls: ↑ ↓ (or W S) walk, Enter opens the nearest gate ahead, clicking a far gate walks you to it. No wheel, no zoom.
import { useEffect, useMemo, useRef, useState, type Ref } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useHint } from '../../store/app';
import { useHover } from '../../world/useHover';
import { CoverCollage } from './CoverCollage';
import { isTyping, prefersReducedMotion } from './motion';
import { frameLabel } from './playlistsStore';

export interface GateItem { id: string; label: string; sub?: string; covers: (string | null)[]; accent?: string; onOpen: () => void }

const START_Z = 4, FIRST_Z = -12, SPACING = 10, SIDE_X = 4.6, SIZE = 4.4, GATE_Y = 2.7;
const CAM_Y = 2.2, W = 16, H = 7.5, SPEED = 7;
const GATE_FRAME = new THREE.EdgesGeometry(new THREE.PlaneGeometry(SIZE + 0.16, SIZE + 0.16));
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

function ribs(zFrom: number, zTo: number): THREE.BufferGeometry {
  const pts: number[] = []; const x = W / 2;
  const seg = (a: number[], b: number[]) => pts.push(a[0], a[1], a[2], b[0], b[1], b[2]);
  for (let z = zFrom; z >= zTo; z -= 5) {
    seg([-x, 0, z], [x, 0, z]); seg([x, 0, z], [x, H, z]); seg([x, H, z], [-x, H, z]); seg([-x, H, z], [-x, 0, z]);
  }
  for (const [px, py] of [[-x, 0], [x, 0], [x, H], [-x, H]]) seg([px, py, zFrom], [px, py, zTo]);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
  return g;
}

interface Ctl { target: number; z: number }

function Gate({ item, index, grid, ctl }: { item: GateItem; index: number; grid: number; ctl: { current: Ctl } }) {
  const side = index % 2 === 0 ? -1 : 1;
  const z = FIRST_Z - index * SPACING;
  const accent = item.accent ?? '#ffffff';
  const [near, setNear] = useState(false);
  const { hover, bind } = useHover(near ? 'ENTER' : 'WALK THERE');
  const pop = useRef<THREE.Group>(null);
  const sub = useRef<{ fillOpacity: number } | null>(null);
  useFrame(() => {
    const dist = Math.abs(ctl.current.z - z);
    const n = dist < 16;
    if (n !== near) setNear(n);
    if (sub.current) sub.current.fillOpacity = clamp01((17 - dist) / 6);   // details only appear when you are close
    if (pop.current) {
      const k = hover ? 1 : 0;
      pop.current.position.z = THREE.MathUtils.lerp(pop.current.position.z, k * 0.35, 0.12);
      pop.current.scale.setScalar(THREE.MathUtils.lerp(pop.current.scale.x, 1 + k * 0.03, 0.12));
    }
  });
  return (
    <group position={[side * SIDE_X, GATE_Y, z]} rotation={[0, -side * 0.42, 0]}>
      <group ref={pop}>
        <CoverCollage covers={item.covers} grid={grid} size={SIZE} hover={hover} />
        <lineSegments geometry={GATE_FRAME} position-z={0.01}><lineBasicMaterial color={accent} transparent opacity={hover ? 1 : 0.8} /></lineSegments>
        <lineSegments geometry={GATE_FRAME} position-z={-0.5} scale={[0.92, 0.92, 1]}><lineBasicMaterial color={accent} transparent opacity={0.35} /></lineSegments>
        <lineSegments geometry={GATE_FRAME} position-z={-1} scale={[0.85, 0.85, 1]}><lineBasicMaterial color={accent} transparent opacity={0.18} /></lineSegments>
        <mesh {...bind} position-z={0.03} onClick={(e) => { e.stopPropagation(); if (near) item.onOpen(); else ctl.current.target = z + 9; }}>
          <planeGeometry args={[SIZE + 0.2, SIZE + 0.2]} />
          <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
        <Text position={[0, -SIZE / 2 - 0.3, 0.02]} fontSize={0.34} letterSpacing={0.14} color={accent} anchorY="top">{frameLabel(item.label, 18)}</Text>
        {item.sub && (
          <Text ref={sub as unknown as Ref<THREE.Mesh>} fillOpacity={0} position={[0, -SIZE / 2 - 0.9, 0.02]} fontSize={0.15} letterSpacing={0.14} color="#bdbdbd" anchorY="top">{item.sub}</Text>
        )}
      </group>
    </group>
  );
}

export function Corridor({ items, grid = 2, emptyText = '' }: { items: GateItem[]; grid?: number; emptyText?: string }) {
  const camera = useThree((s) => s.camera);
  const endZ = items.length ? FIRST_Z - (items.length - 1) * SPACING + 9 : START_Z;
  const ctl = useRef<Ctl>({ target: START_Z, z: START_Z });
  const held = useRef({ fwd: false, back: false });
  const [nearIdx, setNearIdx] = useState(0);
  const reduce = useMemo(prefersReducedMotion, []);
  const geo = useMemo(() => ribs(START_Z + 4, endZ - 14), [endZ]);
  useEffect(() => () => geo.dispose(), [geo]);

  useHint(items.length ? '↑ ↓ WALK  ·  CLICK A GATE  ·  / SEARCH' : '');

  useEffect(() => {
    camera.position.set(0, CAM_Y, START_Z);
    camera.lookAt(0, CAM_Y, START_Z - 10);
  }, [camera]);

  const itemsRef = useRef(items); itemsRef.current = items;
  useEffect(() => {
    const set = (e: KeyboardEvent, v: boolean) => {
      const k = e.key.toLowerCase();
      if (k === 'arrowup' || k === 'w') { held.current.fwd = v; if (v) e.preventDefault(); }
      else if (k === 'arrowdown' || k === 's') { held.current.back = v; if (v) e.preventDefault(); }
    };
    const down = (e: KeyboardEvent) => {
      if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      set(e, true);
      if (e.key === 'Enter') {   // open the nearest gate that is ahead of us and close enough
        let best = -1, bestD = 15;
        itemsRef.current.forEach((_, i) => {
          const d = ctl.current.z - (FIRST_Z - i * SPACING);
          if (d > -2 && d < bestD) { best = i; bestD = d; }
        });
        if (best >= 0) itemsRef.current[best].onOpen();
      }
    };
    const up = (e: KeyboardEvent) => set(e, false);
    const blur = () => { held.current.fwd = false; held.current.back = false; };
    window.addEventListener('keydown', down); window.addEventListener('keyup', up); window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, []);

  useFrame(({ camera: c, pointer }, dt) => {
    const k = ctl.current;
    if (held.current.fwd) k.target -= SPEED * dt;
    if (held.current.back) k.target += SPEED * dt;
    k.target = Math.max(endZ, Math.min(START_Z, k.target));
    k.z = reduce ? k.target : k.z + (k.target - k.z) * (1 - Math.exp(-dt * 4.5));
    c.position.set(0, CAM_Y, k.z);
    c.lookAt(0, CAM_Y, k.z - 10);
    c.rotateY(-pointer.x * 0.22);
    c.rotateX(pointer.y * 0.05);
    const idx = items.length ? Math.max(0, Math.min(items.length - 1, Math.round((FIRST_Z - (k.z - 12)) / SPACING))) : 0;
    if (idx !== nearIdx) setNearIdx(idx);
  });

  const from = Math.max(0, nearIdx - 2), to = Math.min(items.length - 1, nearIdx + 5);   // only the gates around you exist
  return (
    <group>
      <lineSegments geometry={geo}><lineBasicMaterial color="#ffffff" transparent opacity={0.2} /></lineSegments>
      {emptyText && <Text position={[0, 2.4, -8]} fontSize={0.22} letterSpacing={0.15} color="#8a8a8a">{emptyText}</Text>}
      {items.slice(from, to + 1).map((it, j) => <Gate key={it.id} item={it} index={from + j} grid={grid} ctl={ctl} />)}
    </group>
  );
}
