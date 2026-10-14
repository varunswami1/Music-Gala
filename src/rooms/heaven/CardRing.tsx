// Round room of album cards, built as LAYERS: albums behind albums. Owner: Person 3.
// Full 360°: tap ← → for one card, HOLD to keep turning (a full lap in about 3.5 s).
// Each layer (cluster of <= 54 songs) is a ring of cards; further layers sit at a bigger radius behind the front one, offset
// by half a card so they peek through the gaps. Keyboard only (no wheel, no zoom):
//   ← → turn the ring (hold = continuous)   ↑ ↓ send the front layer back / bring the next one forward   G change grouping
// The eye is at the middle row, so you never have to look up or down. Only ~3 layers (<=162 cards) are mounted.
import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { Song } from '../../contract/types';
import { to } from '../../contract/routes';
import { useHint } from '../../store/app';
import { useCover } from '../../world/Poster';
import { useHover } from '../../world/useHover';
import { buildClusters, type Cluster } from './clusters';
import { useRing } from './ringStore';
import { isTyping, prefersReducedMotion } from './motion';
import { tunnelGo } from './tunnel';
import { useTurn } from './turn';

const R0 = 9.5, GAP = 3.4;                 // front radius (wide, so you see many cards at a distance), extra radius per layer behind
const CARD = 1.4, PITCH = 1.6;             // card size, row spacing
export const RING_EYE_Y = 2.3;             // camera height = middle row, so no head tilt is needed
const MAX_COLS = 24, MIN_COLS = 10, MAX_ROWS = 3;
export const RING_RADIUS = R0 + 2 * GAP + 3;   // wire cylinder that contains up to 3 layers
const INTRO_DELAY = 1.3;                   // seconds: cards fade in after the camera has walked in through the lobby
const TAU = Math.PI * 2;
const PLANE = new THREE.PlaneGeometry(CARD, CARD);
const FRAME = new THREE.EdgesGeometry(new THREE.PlaneGeometry(CARD + 0.08, CARD + 0.08));
const WHITE = new THREE.Color('#ffffff');

interface LayerState { k: number; R: number; opacity: number; dim: number }

const layoutOf = (n: number) => {
  const cols = Math.min(MAX_COLS, Math.max(MIN_COLS, Math.ceil(n / MAX_ROWS)));
  return { cols, rows: Math.max(1, Math.ceil(n / cols)) };
};
/** Angle of card i in layer k. Odd layers are shifted half a card ("bricks") so they show through the gaps in front. */
const angleOf = (k: number, i: number, cols: number) => (((i % cols) + (k % 2) * 0.5) / cols) * TAU;
const rowY = (i: number, cols: number, rows: number) => RING_EYE_Y + ((rows - 1) / 2 - Math.floor(i / cols)) * PITCH;
const hue = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));

interface RingCardProps { song: Song; layer: number; i: number; cols: number; rows: number; st: LayerState; accent: string; onBring: () => void }

function RingCard({ song, layer, i, cols, rows, st, accent, onBring }: RingCardProps) {
  const artist = song.artistNames.join(', ') || 'Unknown artist';
  const tex = useCover(song.coverUrl);
  const { hover, bind } = useHover(`${song.title} · ${artist}`);
  const pinned = useRing((s) => s.pinnedId === song.id);
  const outer = useRef<THREE.Group>(null);
  const pop = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const line = useRef<THREE.LineBasicMaterial>(null);
  const angle = useMemo(() => angleOf(layer, i, cols), [layer, i, cols]);
  const y = rowY(i, cols, rows);
  const base = useMemo(() => (tex ? WHITE : new THREE.Color(`hsl(${hue(song.title)}, 35%, 16%)`)), [tex, song.title]);
  const active = hover || pinned;

  useFrame(() => {
    const o = outer.current, p = pop.current, m = mat.current, l = line.current;
    if (!o || !p || !m || !l) return;
    o.position.set(Math.sin(angle) * st.R, y, -Math.cos(angle) * st.R);
    o.visible = st.opacity > 0.01;
    const front = st.dim > 0.9;
    const k = active && (front || pinned) ? 1 : 0;
    p.position.z = THREE.MathUtils.lerp(p.position.z, k * (pinned ? 1.8 : 0.6), 0.18);     // local +z points to the room centre
    p.scale.setScalar(THREE.MathUtils.lerp(p.scale.x, 1 + k * (pinned ? 0.5 : 0.18), 0.18));
    m.color.copy(base).multiplyScalar(st.dim * (active ? 1 : 0.8));
    m.opacity = st.opacity;
    l.opacity = st.opacity * (active ? 1 : 0.45) * Math.min(1, st.dim * 1.4);
  });

  return (
    <group ref={outer} position={[Math.sin(angle) * st.R, y, -Math.cos(angle) * st.R]} rotation={[0, -angle, 0]}>
      <group ref={pop}>
        <mesh geometry={PLANE} {...bind}
          raycast={function (this: THREE.Mesh, rc: THREE.Raycaster, hits: THREE.Intersection[]) {
            if (st.opacity > 0.05) THREE.Mesh.prototype.raycast.call(this, rc, hits);   // faded-out layers must not catch the pointer
          }}
          onClick={(e) => { e.stopPropagation(); onBring(); }}
          onDoubleClick={(e) => { e.stopPropagation(); tunnelGo(to.song(song.id), song.title); }}>
          <meshBasicMaterial key={tex ? 'tex' : 'none'} ref={mat} map={tex ?? null} transparent opacity={0} />
        </mesh>
        <lineSegments geometry={FRAME} position-z={0.01}>
          <lineBasicMaterial ref={line} color={accent} transparent opacity={0} />
        </lineSegments>
        {active && (
          <Text position={[0, -CARD / 2 - 0.12, 0.02]} fontSize={0.13} letterSpacing={0.06} color="#ffffff" anchorY="top"
            textAlign="center" maxWidth={CARD + 1.4}>{`${song.title}\n${artist}`}</Text>
        )}
      </group>
    </group>
  );
}

function Layer({ k, cluster, registry, accent, onBring }: { k: number; cluster: Cluster; registry: MutableRefObject<Set<LayerState>>; accent: string; onBring: (k: number) => void }) {
  const { cols, rows } = layoutOf(cluster.songs.length);
  const st = useMemo<LayerState>(() => ({ k, R: R0 + k * GAP, opacity: 0, dim: 1 }), [k]);
  useEffect(() => { registry.current.add(st); return () => { registry.current.delete(st); }; }, [st, registry]);
  return (
    <group>
      {cluster.songs.map((s, i) => (
        <RingCard key={s.id} song={s} layer={k} i={i} cols={cols} rows={rows} st={st} accent={accent} onBring={() => onBring(k)} />
      ))}
    </group>
  );
}

export function CardRing({ songs, accent }: { songs: Song[]; accent: string }) {
  const mode = useRing((s) => s.mode);
  const index = useRing((s) => s.index);
  const focusId = useRing((s) => s.focusId);
  const pending = useRing((s) => s.pendingFocus);
  const pinnedId = useRing((s) => s.pinnedId);
  const clusters = useMemo(() => buildClusters(songs, mode), [songs, mode]);

  useEffect(() => {
    const r = useRing.getState();
    r.setClusters(clusters.map((c) => ({ id: c.id, label: c.label, count: c.songs.length })));
    r.setPool(songs);
  }, [clusters, songs]);
  useEffect(() => () => useRing.getState().reset(), []);

  const page = Math.min(Math.max(0, index), Math.max(0, clusters.length - 1));
  const cluster = clusters[page];
  const front = layoutOf(cluster?.songs.length ?? 0);
  const stepRef = useRef(TAU / front.cols); stepRef.current = TAU / front.cols;

  const group = useRef<THREE.Group>(null);
  const registry = useRef(new Set<LayerState>());
  const pos = useRef(page), intro = useRef(0);
  const turn = useTurn(stepRef);
  const { target, current } = turn;
  const reduce = useMemo(prefersReducedMotion, []);
  const mountedAt = useRef(performance.now());

  // Keep the layer that was just sent back mounted while it dissolves.
  const lastPage = useRef(page);
  const [leaving, setLeaving] = useState<number | null>(null);
  useEffect(() => {
    const prev = lastPage.current; lastPage.current = page;
    if (page === prev + 1) { setLeaving(prev); const t = setTimeout(() => setLeaving(null), 900); return () => clearTimeout(t); }
    setLeaving(null);
  }, [page]);

  // New grouping / new songs: start clean.
  useEffect(() => { pos.current = page; target.current = 0; current.current = 0; intro.current = !reduce && performance.now() - mountedAt.current < 500 ? -INTRO_DELAY : 0; }, [clusters]); // eslint-disable-line react-hooks/exhaustive-deps

  // Search: bring a song to the front (works for requests made before this room opened, too).
  useEffect(() => {
    const id = focusId ?? pending;
    if (!id || clusters.length === 0) return;
    let found = false;
    for (let ci = 0; ci < clusters.length && !found; ci++) {
      const i = clusters[ci].songs.findIndex((s) => s.id === id);
      if (i < 0) continue;
      found = true;
      const { cols } = layoutOf(clusters[ci].songs.length);
      const a = angleOf(ci, i, cols);
      target.current = a + TAU * Math.round((current.current - a) / TAU);   // world angle is a - rotation, so rotation = a puts it in front
      useRing.setState({ index: ci, focusId: null, pendingFocus: null, pinnedId: id });
    }
    if (!found) useRing.setState({ focusId: null, pendingFocus: null });
  }, [focusId, pending, clusters]);
  useEffect(() => {
    if (!pinnedId) return;
    const t = setTimeout(() => { if (useRing.getState().pinnedId === pinnedId) useRing.setState({ pinnedId: null }); }, 6000);
    return () => clearTimeout(t);
  }, [pinnedId]);

  useHint(cluster
    ? `${cluster.label}  ${page + 1}/${clusters.length}  ·  ← → TURN  ·  ↑ ↓ LAYERS  ·  G GROUP  ·  / SEARCH`
    : '');

  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (isTyping(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      const ring = useRing.getState();
      const k = e.key.toLowerCase();
      if (k === 'arrowdown' || k === 's' || k === 'pagedown') { e.preventDefault(); useRing.setState({ index: Math.min(ring.clusters.length - 1, ring.index + 1) }); }
      else if (k === 'arrowup' || k === 'w' || k === 'pageup') { e.preventDefault(); useRing.setState({ index: Math.max(0, ring.index - 1) }); }
      else if (k === 'g') ring.cycleMode();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);

  useFrame((_, dt) => {
    const g = group.current; if (!g) return;
    if (reduce || Math.abs(page - pos.current) > 1.6) pos.current = page;
    else pos.current += (page - pos.current) * (1 - Math.exp(-dt * 5.5));
    if (Math.abs(page - pos.current) < 0.002) pos.current = page;
    g.rotation.y = turn.tick(dt, reduce);
    intro.current = reduce ? 1 : Math.min(1, intro.current + dt * 2.2);
    registry.current.forEach((st) => {
      const d = st.k - pos.current;
      st.R = d >= 0 ? R0 + d * GAP : R0 + d * 1.6;                       // passed layers glide toward the viewer while fading
      const vis = d < 0 ? clamp01(1 + d / 0.6) : d > 2.4 ? clamp01(1 - (d - 2.4) / 0.8) : 1;
      st.opacity = vis * Math.max(0, intro.current);
      st.dim = d <= 0 ? 1 : 1 / (1 + 0.9 * d);                           // layers further back are darker
    });
  });

  if (!cluster) {
    return <Text position={[0, RING_EYE_Y, -5]} fontSize={0.25} letterSpacing={0.15} color="#8a8a8a">NO SONGS HERE YET</Text>;
  }
  const mounted = [page, page + 1, page + 2].filter((k) => k < clusters.length);
  if (leaving !== null && leaving < clusters.length && !mounted.includes(leaving)) mounted.push(leaving);
  const bring = (k: number) => { if (k !== useRing.getState().index) useRing.setState({ index: k }); };
  return (
    <group ref={group}>
      {mounted.map((k) => <Layer key={clusters[k].id} k={k} cluster={clusters[k]} registry={registry} accent={accent} onBring={bring} />)}
    </group>
  );
}
