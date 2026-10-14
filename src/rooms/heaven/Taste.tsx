// TASTE: your listening as three equalizers around you. Owner: Person 3 (redesign of the placeholder).
// "This scene shows your taste as rings of frequency bars, pulsing like a beat travelling around the room, because taste in music
//  is rhythm and proportion." Inner ring = top artists, middle ring = scenes, outer ring = years. Bar height = number of songs.
// ← → turn (hold for a full lap). Click a scene or an artist to go there. You walk in through the narrow lobby like every other room.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { RoomDef } from '../../contract/types';
import { PATHS, to } from '../../contract/routes';
import { useHint } from '../../store/app';
import { useLibraryData } from '../../data/library';
import { useCover } from '../../world/Poster';
import { useHover } from '../../world/useHover';
import { WireCylinder } from '../../world/Wire';
import { useFixedCamera } from './camera';
import { prefersReducedMotion } from './motion';
import { RoomVestibule } from './Vestibule';
import { tasteStats, type TasteBar } from './tasteStats';
import { tunnelGo } from './tunnel';
import { useTurn } from './turn';

const TAU = Math.PI * 2;
const EYE_Y = 2.3;
const WALL = 17;
const EYE: [number, number, number] = [0, EYE_Y, 0];
const LOOK: [number, number, number] = [0, EYE_Y, -1];
const BOX = (() => { const g = new THREE.BoxGeometry(1, 1, 1); g.translate(0, 0.5, 0); return g; })();   // unit bar, origin at its foot
const BOX_EDGES = new THREE.EdgesGeometry(BOX);

interface RingSpec { radius: number; width: (n: number, r: number) => number; depth: number; minH: number; maxH: number; gamma: number; title: string }
const RINGS: Record<'artists' | 'scenes' | 'years', RingSpec> = {
  artists: { radius: 6.5, width: () => 1.1, depth: 0.5, minH: 0.7, maxH: 3.2, gamma: 1, title: 'TOP ARTISTS' },
  scenes: { radius: 9.8, width: () => 1.6, depth: 0.6, minH: 0.8, maxH: 4.6, gamma: 1, title: 'SCENES' },
  years: { radius: 13.2, width: (n, r) => Math.max(0.2, Math.min(0.9, (TAU * r / n) * 0.6)), depth: 0.25, minH: 0.2, maxH: 5.6, gamma: 0.8, title: 'YEARS' },
};

function EqBar({ bar, angle, spec, n, max, showLabel, onOpen, beat }: {
  bar: TasteBar; angle: number; spec: RingSpec; n: number; max: number; showLabel: boolean; onOpen?: () => void; beat: boolean;
}) {
  const h = spec.minH + (spec.maxH - spec.minH) * Math.pow(bar.count / Math.max(1, max), spec.gamma);
  const w = spec.width(n, spec.radius);
  const color = bar.color ?? '#ffffff';
  const tex = useCover(bar.coverUrl ?? null);
  const { hover, bind } = useHover(`${bar.label.toUpperCase()} · ${bar.count} SONGS`);
  const body = useRef<THREE.Group>(null);
  const reduce = useRef(prefersReducedMotion());
  const phase = useMemo(() => (angle * 7.3) % TAU, [angle]);
  useFrame(({ clock }) => {
    const b = body.current; if (!b) return;
    const t = clock.elapsedTime;
    // each bar breathes on its own phase; a sharp beat travels around the ring every ~3 s (rhythm, not a constant spin)
    const pulse = reduce.current || !beat ? 0 : Math.pow(Math.max(0, Math.sin(t * 2.1 - angle * 2)), 10) * 0.12;
    const breath = reduce.current ? 0 : Math.sin(t * 0.7 + phase) * 0.04;
    b.scale.set(w, h * (1 + breath + pulse + (hover ? 0.05 : 0)), spec.depth);
  });
  return (
    <group position={[Math.sin(angle) * spec.radius, 0, -Math.cos(angle) * spec.radius]} rotation={[0, -angle, 0]}>
      <group ref={body} scale={[w, h, spec.depth]}>
        <mesh geometry={BOX} {...bind} onClick={(e) => { if (onOpen) { e.stopPropagation(); onOpen(); } }}>
          <meshBasicMaterial color={color} transparent opacity={hover ? 0.32 : 0.1} depthWrite={false} />
        </mesh>
        <lineSegments geometry={BOX_EDGES}><lineBasicMaterial color={color} transparent opacity={hover ? 1 : 0.7} /></lineSegments>
      </group>
      {bar.coverUrl !== undefined && (
        <mesh position={[0, h + 0.2 + w / 2, 0]} raycast={() => null}>
          <planeGeometry args={[w, w]} />
          {tex ? <meshBasicMaterial key="t" map={tex} /> : <meshBasicMaterial key="n" color="#1a1a1a" />}
        </mesh>
      )}
      {showLabel && (
        <Text position={[0, h + (bar.coverUrl !== undefined ? w + 0.45 : 0.3), 0]} fontSize={spec === RINGS.years ? 0.28 : 0.2} letterSpacing={0.12} color={color} anchorY="bottom" maxWidth={3.2} textAlign="center">
          {bar.label.toUpperCase().slice(0, 22)}
        </Text>
      )}
    </group>
  );
}

function FloorRing({ radius, title }: { radius: number; title: string }) {
  const geo = useMemo(() => {
    const pts: number[] = [];
    for (let i = 0; i < 96; i++) { const a = (i / 96) * TAU, b = ((i + 1) / 96) * TAU; pts.push(Math.sin(a) * radius, 0.01, -Math.cos(a) * radius, Math.sin(b) * radius, 0.01, -Math.cos(b) * radius); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3)); return g;
  }, [radius]);
  return (
    <group>
      <lineSegments geometry={geo}><lineBasicMaterial color="#ffffff" transparent opacity={0.18} /></lineSegments>
      <Text position={[0, 0.02, -radius + 0.9]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.3} letterSpacing={0.3} color="#8a8a8a">{title}</Text>
    </group>
  );
}

function Ring({ kind, bars, onOpen }: { kind: keyof typeof RINGS; bars: TasteBar[]; onOpen?: (b: TasteBar) => void }) {
  const spec = RINGS[kind];
  const max = Math.max(1, ...bars.map((b) => b.count));
  return (
    <group>
      <FloorRing radius={spec.radius} title={spec.title} />
      {bars.map((b, i) => (
        <EqBar key={b.id} bar={b} spec={spec} n={bars.length} max={max} angle={((i + 0.5) / bars.length) * TAU}
          showLabel={kind !== 'years' || Number(b.label) % 5 === 0} beat onOpen={onOpen ? () => onOpen(b) : undefined} />
      ))}
    </group>
  );
}

function TasteScene() {
  const lib = useLibraryData();
  const stats = useMemo(() => (lib ? tasteStats(lib) : null), [lib]);
  const group = useRef<THREE.Group>(null);
  const stepRef = useRef(TAU / 24);
  const turn = useTurn(stepRef);
  const reduce = useMemo(prefersReducedMotion, []);
  const age = useRef(0);
  useFixedCamera(EYE, LOOK);
  useHint(stats ? `${stats.totals.songs.toLocaleString()} SONGS  ·  ${stats.totals.artists.toLocaleString()} ARTISTS  ·  ${stats.totals.scenes} SCENES  ·  ← → TURN (HOLD FOR A LAP)  ·  / SEARCH` : '');
  useFrame((_, dt) => {
    const g = group.current; if (!g) return;
    g.rotation.y = turn.tick(dt, reduce);
    age.current += dt;
    // the bars rise once the camera has walked in through the lobby (so it never passes through them)
    const k = reduce ? 1 : Math.max(0, Math.min(1, (age.current - 1.4) / 1.0));
    g.scale.y = Math.max(0.001, k * k * (3 - 2 * k));
  });
  return (
    <group>
      <WireCylinder radius={WALL} height={8} position={[0, 4, 0]} opacity={0.22} segments={48} />
      <RoomVestibule wallZ={WALL} />
      {!stats && <Text position={[0, EYE_Y, -5]} fontSize={0.25} color="#8a8a8a">LOADING…</Text>}
      {stats && (
        <group ref={group}>
          <Ring kind="artists" bars={stats.artists} onOpen={(b) => tunnelGo(to.artist(b.id), b.label)} />
          <Ring kind="scenes" bars={stats.scenes} onOpen={(b) => tunnelGo(to.libraryRoom(b.id), b.label)} />
          <Ring kind="years" bars={stats.years} />
        </group>
      )}
    </group>
  );
}
export const tasteRoom: RoomDef = { id: 'taste', path: PATHS.taste, title: 'Taste', Scene: TasteScene };
