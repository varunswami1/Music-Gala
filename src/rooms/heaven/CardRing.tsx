// The cylindrical ring of song cards (the one design kept from the TasteMap prototype). Owner: Person 3.
// Interaction: wheel or ← → rotate, ↑ ↓ switch cluster, hover pops a card (title + artist), double-click opens the song.
// Scale: songs are grouped into clusters (by artist / year / all) of at most 54 cards and ONLY the current cluster is drawn,
// so a 6,000-song library costs the same as a 54-song one (docs/DESIGN.md §8). Textures are created per visible card and
// disposed when the cluster changes. Shared geometry is module-level; nothing else is allocated per card.
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Song } from '../../contract/types';
import { to } from '../../contract/routes';
import { useApp, useHint } from '../../store/app';
import { useCover } from '../../world/Poster';
import { useHover } from '../../world/useHover';
import { buildClusters } from './clusters';
import { useRing } from './ringStore';
import { prefersReducedMotion } from './motion';

const MAX_COLS = 18, MIN_COLS = 8, MAX_ROWS = 3, W = 1.6, ROW_GAP = 0.3, R = 6.2, CENTER_Y = 2.9;
const PLANE = new THREE.PlaneGeometry(W, W);
const FRAME = new THREE.EdgesGeometry(new THREE.PlaneGeometry(W + 0.1, W + 0.1));

const typing = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement | null;
  return !!t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable);
};
const overPanel = (e: Event) => !!(e.target as HTMLElement | null)?.closest?.('.panel');
const hue = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };

interface RingCardProps { song: Song; angle: number; y: number; accent: string; onOpen: () => void }

function RingCard({ song, angle, y, accent, onOpen }: RingCardProps) {
  const artist = song.artistNames.join(', ') || 'Unknown artist';
  const tex = useCover(song.coverUrl);
  const { hover, bind } = useHover(`${song.title} · ${artist}`);
  const pop = useRef<THREE.Group>(null);
  useFrame(() => {
    const g = pop.current; if (!g) return;
    const k = hover ? 1 : 0;
    g.position.z = THREE.MathUtils.lerp(g.position.z, k * 0.6, 0.18);   // local +z points to the room centre
    g.scale.setScalar(THREE.MathUtils.lerp(g.scale.x, 1 + k * 0.18, 0.18));
  });
  return (
    <group position={[Math.sin(angle) * R, y, -Math.cos(angle) * R]} rotation={[0, -angle, 0]}>
      <group ref={pop}>
        <mesh geometry={PLANE} {...bind} onDoubleClick={(e) => { e.stopPropagation(); onOpen(); }}>
          {tex
            ? <meshBasicMaterial key="tex" map={tex} color={hover ? '#ffffff' : '#bdbdbd'} />
            : <meshBasicMaterial key="none" color={`hsl(${hue(song.title)}, 35%, ${hover ? 24 : 16}%)`} />}
        </mesh>
        <lineSegments geometry={FRAME} position-z={0.01}>
          <lineBasicMaterial color={accent} transparent opacity={hover ? 1 : 0.5} />
        </lineSegments>
        {hover && (
          <Text position={[0, -W / 2 - 0.12, 0.02]} fontSize={0.13} letterSpacing={0.06} color="#ffffff" anchorY="top"
            textAlign="center" maxWidth={W + 1.4}>{`${song.title}\n${artist}`}</Text>
        )}
      </group>
    </group>
  );
}

export function CardRing({ songs, accent }: { songs: Song[]; accent: string }) {
  const go = useApp((s) => s.go);
  const mode = useRing((s) => s.mode);
  const index = useRing((s) => s.index);
  const clusters = useMemo(() => buildClusters(songs, mode), [songs, mode]);

  // Publish cluster list to the HTML controls; clear it when the ring goes away.
  useEffect(() => {
    useRing.getState().setClusters(clusters.map((c) => ({ id: c.id, label: c.label, count: c.songs.length })));
  }, [clusters]);
  useEffect(() => () => useRing.getState().reset(), []);

  const page = Math.min(Math.max(0, index), Math.max(0, clusters.length - 1));
  const cluster = clusters[page];
  const n = cluster?.songs.length ?? 0;
  const cols = Math.min(MAX_COLS, Math.max(MIN_COLS, Math.ceil(n / MAX_ROWS)));
  const rows = Math.max(1, Math.ceil(n / cols));

  const colsRef = useRef(cols); colsRef.current = cols;
  const group = useRef<THREE.Group>(null);
  const target = useRef(0), current = useRef(0), intro = useRef(0);
  const reduce = useMemo(prefersReducedMotion, []);

  useHint(clusters.length > 1
    ? `SCROLL OR ← → ROTATE · ↑ ↓ NEXT CLUSTER (${page + 1}/${clusters.length}) · DOUBLE-CLICK A CARD TO OPEN`
    : 'SCROLL OR ← → ROTATE · DOUBLE-CLICK A CARD TO OPEN');

  useEffect(() => { target.current = 0; current.current = 0; intro.current = 0; }, [cluster?.id]);

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      const step = (2 * Math.PI) / colsRef.current;
      const ring = useRing.getState();
      if (e.key === 'ArrowLeft') target.current += step;
      else if (e.key === 'ArrowRight') target.current -= step;
      else if (e.key === 'ArrowDown' || e.key === 'PageDown') { e.preventDefault(); ring.setIndex(ring.index + 1); }
      else if (e.key === 'ArrowUp' || e.key === 'PageUp') { e.preventDefault(); ring.setIndex(ring.index - 1); }
    };
    // Never rotate the world while the pointer is over a scrollable HTML panel.
    const wheel = (e: WheelEvent) => { if (!overPanel(e)) target.current -= e.deltaY * 0.0015; };
    window.addEventListener('keydown', key);
    window.addEventListener('wheel', wheel, { passive: true });
    return () => { window.removeEventListener('keydown', key); window.removeEventListener('wheel', wheel); };
  }, []);

  useFrame((_, dt) => {
    const g = group.current; if (!g) return;
    if (reduce) { current.current = target.current; intro.current = 1; }
    else {
      current.current += (target.current - current.current) * (1 - Math.exp(-dt * 6));
      intro.current = Math.min(1, intro.current + dt * 2.5);
    }
    g.rotation.y = current.current;
    const e = 1 - Math.pow(1 - intro.current, 3);
    g.scale.setScalar(0.85 + 0.15 * e);
  });

  if (!cluster) {
    return <Text position={[0, 2.5, -5]} fontSize={0.25} letterSpacing={0.15} color="#8a8a8a">NO SONGS HERE YET</Text>;
  }
  return (
    <group ref={group}>
      {cluster.songs.map((s, i) => {
        const col = i % cols, row = Math.floor(i / cols);
        return (
          <RingCard key={s.id} song={s} accent={accent} angle={(col / cols) * Math.PI * 2}
            y={CENTER_Y + ((rows - 1) / 2 - row) * (W + ROW_GAP)} onOpen={() => go(to.song(s.id))} />
        );
      })}
    </group>
  );
}
