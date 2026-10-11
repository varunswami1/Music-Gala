// TASTE: your listening, compiled. Owner: Person 5.
// A long wireframe hall: a piano, a violin and a turntable with dot-cloud listeners, your top artists as canvases on the side walls,
// and your release years as an equaliser skyline on the back wall. Everything responds to the language filter on the right.
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
import { CanvasFrame } from '../../world/CanvasFrame';
import { useTaste } from './store';
import { DotPerson, Piano, Turntable, Violin } from './props';

/** One thin equaliser bar: outline plus faint fill, easing to its height and breathing a little. */
function Bar({ x, z, value, maxH, width, label, count, phase }: { x: number; z: number; value: number; maxH: number; width: number; label: string; count: number; phase: number }) {
  const body = useRef<THREE.Group>(null);
  const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), []);
  useFrame(({ clock }) => {
    const g = body.current; if (!g) return;
    const goal = Math.max(0.04, value * maxH) * (1 + Math.sin(clock.getElapsedTime() * 1.4 + phase) * 0.03);
    g.scale.y = THREE.MathUtils.lerp(g.scale.y, goal, 0.1); g.position.y = g.scale.y / 2;
  });
  return (
    <group position={[x, 0, z]}>
      <group ref={body} scale={[width, 0.04, width * 0.5]}>
        <mesh><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.08} depthWrite={false} /></mesh>
        <lineSegments geometry={geo}><lineBasicMaterial color="#ffffff" transparent opacity={0.85} /></lineSegments>
      </group>
      <Text position={[0, 0.2, 0.3]} fontSize={0.2} letterSpacing={0.08} color="#7a7a7a" anchorY="bottom">{label}</Text>
      {count > 0 && <Text position={[0, Math.max(0.04, value * maxH) + 0.25, 0]} fontSize={0.2} color="#ffffff">{String(count)}</Text>}
    </group>
  );
}

const HALL = { w: 11, h: 7, z0: -15, z1: 9 };
// Instruments and the people near them. All positions are in metres on the hall floor.
const PIANO = { x: -3.5, z: -3.2, yaw: 0.6 }, VIOLIN = { x: 3.5, z: -3.4, yaw: -0.6 }, DECK = { x: 0, z: -9.4 };
const at = (o: { x: number; z: number; yaw: number }, lx: number, lz: number): [number, number] => [o.x + Math.cos(o.yaw) * lx + Math.sin(o.yaw) * lz, o.z - Math.sin(o.yaw) * lx + Math.cos(o.yaw) * lz];

function TasteScene() {
  const go = useApp((s) => s.go);
  const lib = useLibraryData();
  const language = useTaste((s) => s.language);
  useRoomCamera([0, 1.7, 5.2], [0, 2.0, -12], 0.3);
  useHint('DRAG TO LOOK AROUND · PICK A LANGUAGE ON THE RIGHT');
  const stats = useMemo(() => (lib ? tasteStats(lib, language) : null), [lib, language]);
  const walls = useMemo(() => {
    if (!lib || !stats) return [];
    return stats.topArtists.filter((a) => a.artist).slice(0, 4).map((a, i) => {
      const songs = lib.songsByArtist.get(a.artist!.id) ?? [];
      const covers = songs.filter((s) => s.coverUrl).sort((x, y) => Number(y.isFavourite) - Number(x.isFavourite)).map((s) => s.coverUrl as string);
      return { artist: a.artist!, count: a.count, covers, side: i % 2 === 0 ? -1 : 1, row: Math.floor(i / 2) };
    });
  }, [lib, stats]);
  const [sx, sz] = at(PIANO, 0, 1.8), [lx, lz] = at(VIOLIN, 0.2, 2.6), [dx, dz] = [DECK.x + 3.1, DECK.z + 2.6];

  return (
    <group>
      <WireBox size={[HALL.w, HALL.h, HALL.z1 - HALL.z0]} position={[0, HALL.h / 2, (HALL.z0 + HALL.z1) / 2]} />
      {/* back wall: outlined title and the equaliser skyline of release years */}
      <Text position={[0, 6.1, HALL.z0 + 0.2]} fontSize={1.5} letterSpacing={0.25} fillOpacity={0} strokeWidth={0.016} strokeColor="#ffffff" strokeOpacity={0.9}>TASTE</Text>
      <Text position={[0, 5.3, HALL.z0 + 0.2]} fontSize={0.22} letterSpacing={0.4} color="#7a7a7a">YOUR LISTENING, COMPILED</Text>
      {!stats && <Text position={[0, 2, -8]} fontSize={0.3} color="#8a8a8a">LOADING…</Text>}
      {stats && stats.total === 0 && <Text position={[0, 2, -8]} fontSize={0.25} letterSpacing={0.15} color="#8a8a8a">NO SONGS IN THIS LANGUAGE</Text>}
      {stats && stats.years.map((y, i) => (
        <Bar key={y.label} x={(i - (stats.years.length - 1) / 2) * 0.66} z={HALL.z0 + 0.7} value={y.count / Math.max(1, ...stats.years.map((q) => q.count))} maxH={4.6} width={0.4} label={y.label} count={y.count} phase={i * 0.7} />
      ))}
      {/* instruments */}
      <Piano position={[PIANO.x, 0, PIANO.z]} rotation={[0, PIANO.yaw, 0]} scale={1.9} />
      <Violin position={[VIOLIN.x, 0, VIOLIN.z]} rotation={[0, VIOLIN.yaw, 0]} scale={1.15} />
      <Turntable position={[DECK.x, 0, DECK.z]} scale={1.9} />
      {/* listeners made of points */}
      <DotPerson position={[sx, 0.25, sz]} rotation={[0, PIANO.yaw + Math.PI, 0]} pose="sit" scale={1.75} seed={3} />
      <DotPerson position={[lx, 0, lz]} rotation={[0, VIOLIN.yaw + Math.PI + 0.3, 0]} pose="stand" scale={1.75} seed={5} phase={1.3} />
      <DotPerson position={[dx, 0, dz]} rotation={[0, Math.PI + 0.6, 0]} pose="headphones" scale={1.75} seed={9} phase={2.1} />
      <DotPerson position={[-2.9, 0, -8.4]} rotation={[0, Math.PI + 0.5, 0]} pose="stand" scale={1.75} seed={11} phase={0.4} />
      {/* top artists on the side walls */}
      {walls.map((w) => (
        <CanvasFrame key={w.artist.id} title={w.artist.name} imageUrl={w.artist.imageUrl} collage={w.covers} maxTiles={4} width={3.2} height={2}
          position={[w.side * (HALL.w / 2 - 0.15), 4.3, -9.2 - w.row * 3.8]} rotation={[0, -w.side * Math.PI / 2, 0]}
          caption={`${w.artist.name} · ${w.count} ${w.count === 1 ? 'song' : 'songs'}`} hoverLabel="OPEN ARTIST" onOpen={() => go(to.artist(w.artist.id))} />
      ))}
      {/* the way out is behind you */}
      <Door label="HEAVEN" position={[0, 0, HALL.z1 - 0.4]} rotation={[0, Math.PI, 0]} cursorLabel="BACK TO HEAVEN" onOpen={() => go(PATHS.heaven)} />
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
