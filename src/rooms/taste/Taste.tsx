// TASTE: your listening, compiled. Owner: Person 5. Pure view over the library: scenes as columns, years as a skyline,
// top artists and language filter in the panels. Piano/violin props come later with Person 2's asset list (docs/ASSETS.md).
import { useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { RoomDef } from '../../contract/types';
import { PATHS, to } from '../../contract/routes';
import { useApp, useHint } from '../../store/app';
import { useLibraryData } from '../../data/library';
import { LANGUAGES, languageOf } from '../../data/languages';
import { tasteStats } from '../../data/stats';
import { useRoomCamera } from '../../world/useRoomCamera';
import { WireBox } from '../../world/Wire';
import { Door } from '../../world/Door';
import { useTaste } from './store';

/** A column whose height eases toward `value` (0..1 of maxH). Outline plus a faint fill; no textures, one draw call pair. */
function Column({ x, z = 0, value, maxH, width, color, label, count }: { x: number; z?: number; value: number; maxH: number; width: number; color: string; label: string; count: number }) {
  const body = useRef<THREE.Group>(null);
  const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), []);
  useFrame(() => {
    const g = body.current; if (!g) return;
    const target = Math.max(0.02, value * maxH);
    g.scale.y = THREE.MathUtils.lerp(g.scale.y, target, 0.12);
    g.position.y = g.scale.y / 2;
  });
  return (
    <group position={[x, 0, z]}>
      <group ref={body} scale={[width, 0.02, width]}>
        <mesh><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color={color} transparent opacity={0.16} depthWrite={false} /></mesh>
        <lineSegments geometry={geo}><lineBasicMaterial color={color} transparent opacity={0.9} /></lineSegments>
      </group>
      <Text position={[0, -0.16, 0.2]} fontSize={0.12} letterSpacing={0.08} color="#8a8a8a" anchorY="top" maxWidth={width * 2.2} textAlign="center">{label}</Text>
      <Text position={[0, Math.max(0.02, value * maxH) + 0.18, 0]} fontSize={0.13} color={color}>{String(count)}</Text>
    </group>
  );
}

function TasteScene() {
  const go = useApp((s) => s.go);
  const lib = useLibraryData();
  const language = useTaste((s) => s.language);
  useRoomCamera([0, 1.9, 6], [0, 1.9, -6], 0.3);
  useHint('MOVE THE MOUSE TO LOOK · PICK A LANGUAGE ON THE RIGHT');
  const stats = useMemo(() => (lib ? tasteStats(lib, language) : null), [lib, language]);

  return (
    <group>
      <WireBox size={[22, 7, 30]} position={[0, 3.5, -8]} />
      <Text position={[0, 6.1, -12]} fontSize={0.5} letterSpacing={0.3} color="#ffffff">TASTE</Text>
      {!stats && <Text position={[0, 2, -6]} fontSize={0.25} color="#8a8a8a">LOADING…</Text>}
      {stats && stats.total === 0 && <Text position={[0, 2, -6]} fontSize={0.2} letterSpacing={0.15} color="#8a8a8a">NO SONGS IN THIS LANGUAGE</Text>}
      {stats && stats.total > 0 && (() => {
        const maxScene = Math.max(1, ...stats.scenes.map((s) => s.count));
        const maxYear = Math.max(1, ...stats.years.map((y) => y.count));
        const n = stats.scenes.length;
        return (
          <>
            {stats.scenes.map(({ room, count }, i) => (
              <Column key={room.id} x={(i - (n - 1) / 2) * 1.9} z={-6} value={count / maxScene} maxH={4} width={0.9} color={room.accent} label={room.displayName.toUpperCase()} count={count} />
            ))}
            {stats.years.map((y, i) => (
              <Column key={y.label} x={(i - (stats.years.length - 1) / 2) * 0.62} z={-10.5} value={y.count / maxYear} maxH={1.8} width={0.3} color="#ffffff" label={y.label} count={y.count} />
            ))}
            <Text position={[0, 0.02, -8.2]} rotation={[-Math.PI / 2, 0, 0]} fontSize={0.12} letterSpacing={0.25} color="#555">SCENES (FRONT) · RELEASE YEAR (BACK)</Text>
          </>
        );
      })()}
      <Door label="HEAVEN" position={[0, 0, -1]} cursorLabel="BACK TO HEAVEN" onOpen={() => go(PATHS.heaven)} />
    </group>
  );
}

function TastePanels() {
  const lib = useLibraryData();
  const { language, setLanguage } = useTaste();
  const stats = useMemo(() => (lib ? tasteStats(lib, language) : null), [lib, language]);
  const langCounts = useMemo(() => {
    const m = new Map<string, number>();
    if (lib) for (const s of lib.songs) { const l = languageOf(s); m.set(l, (m.get(l) ?? 0) + 1); }
    return m;
  }, [lib]);
  if (!lib || !stats) return null;
  return (
    <>
      <aside className="panel left">
        <div className="eyebrow">TASTE</div>
        <h1>Your listening</h1>
        <div className="meta">
          <span>SONGS</span><b>{stats.total}</b>
          <span>FAVOURITES</span><b>{stats.favourites}</b>
          <span>ARTISTS</span><b>{stats.artistCount}</b>
          <span>FILTER</span><b>{language ? LANGUAGES.find((l) => l.id === language)?.label : 'All languages'}</b>
        </div>
        <div className="eyebrow">TOP ARTISTS</div>
        <div className="list">
          {stats.topArtists.length === 0 && <div className="eyebrow" style={{ paddingTop: 12 }}>NO ARTISTS YET</div>}
          {stats.topArtists.map((a) => {
            const inner = <span>{a.name}<br /><small>{a.count} {a.count === 1 ? 'song' : 'songs'}</small></span>;
            return a.artist
              ? <Link key={a.artist.id} className="row" style={{ gridTemplateColumns: '1fr', textAlign: 'left' }} to={to.artist(a.artist.id)}>{inner}</Link>
              : <div key={a.name} className="row" style={{ gridTemplateColumns: '1fr', textAlign: 'left' }}>{inner}</div>;
          })}
        </div>
      </aside>
      <aside className="panel right">
        <div className="eyebrow">LANGUAGE (FILTER)</div>
        <div className="list" style={{ flex: 'none', maxHeight: 190 }}>
          <button className="row" style={{ display: 'block', width: '100%', textAlign: 'right', opacity: language === null ? 1 : 0.55 }} onClick={() => setLanguage(null)} aria-pressed={language === null}>ALL · {lib.songs.length}</button>
          {LANGUAGES.filter((l) => langCounts.get(l.id)).map((l) => (
            <button key={l.id} className="row" style={{ display: 'block', width: '100%', textAlign: 'right', opacity: language === l.id ? 1 : 0.55 }} onClick={() => setLanguage(l.id)} aria-pressed={language === l.id}>
              {l.label.toUpperCase()} · {langCounts.get(l.id)}
            </button>
          ))}
        </div>
        <div className="eyebrow" style={{ marginTop: 18 }}>SCENES (ROOMS)</div>
        <div className="list">
          {stats.scenes.map(({ room, count }) => (
            <Link key={room.id} className="row" style={{ gridTemplateColumns: '1fr' }} to={to.libraryRoom(room.id)}>
              <span style={{ color: room.accent }}>{room.displayName}<br /><small>{count} {count === 1 ? 'song' : 'songs'}</small></span>
            </Link>
          ))}
        </div>
        {stats.undated > 0 && <div className="eyebrow" style={{ marginTop: 8 }}>{stats.undated} SONGS HAVE NO YEAR</div>}
      </aside>
    </>
  );
}

export const tasteRoom: RoomDef = { id: 'taste', path: PATHS.taste, title: 'Taste', Scene: TasteScene, Panels: TastePanels };
