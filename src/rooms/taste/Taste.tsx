// TASTE: your listening, compiled. Owner: Person 5.
// A round colonnade with you standing in the middle. Turn all the way round: a turntable ahead, a piano on the left, a violin on the right,
// dot-cloud listeners among them, your top artists hanging between the pillars, your release years as an equaliser skyline behind you,
// and slits in the wall leading back to Heaven and on to Discover. Everything responds to the language filter on the right.
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
import { Colonnade } from '../../world/Colonnade';
import { Door } from '../../world/Door';
import { CanvasFrame } from '../../world/CanvasFrame';
import { polar, yawToCenter } from '../../world/ring';
import { useTaste } from './store';
import { DotPerson, Piano, Turntable, Violin } from './props';

/** One thin equaliser bar: outline plus faint fill, easing to its height and breathing a little. */
function Bar({ x, z, yaw, value, maxH, width, label, count, phase }: { x: number; z: number; yaw: number; value: number; maxH: number; width: number; label: string; count: number; phase: number }) {
  const body = useRef<THREE.Group>(null);
  const geo = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), []);
  useFrame(({ clock }) => {
    const g = body.current; if (!g) return;
    const goal = Math.max(0.04, value * maxH) * (1 + Math.sin(clock.getElapsedTime() * 1.4 + phase) * 0.03);
    g.scale.y = THREE.MathUtils.lerp(g.scale.y, goal, 0.1); g.position.y = g.scale.y / 2;
  });
  return (
    <group position={[x, 0, z]} rotation={[0, yaw, 0]}>
      <group ref={body} scale={[width, 0.04, width * 0.5]}>
        <mesh><boxGeometry args={[1, 1, 1]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.08} depthWrite={false} /></mesh>
        <lineSegments geometry={geo}><lineBasicMaterial color="#ffffff" transparent opacity={0.85} /></lineSegments>
      </group>
      <Text position={[0, 0.2, 0.3]} fontSize={0.2} letterSpacing={0.08} color="#7a7a7a" anchorY="bottom">{label}</Text>
      {count > 0 && <Text position={[0, Math.max(0.04, value * maxH) + 0.25, 0]} fontSize={0.2} color="#ffffff">{String(count)}</Text>}
    </group>
  );
}

const R = 10.5;                       // pillar ring
const at = (o: { x: number; z: number; yaw: number }, lx: number, lz: number): [number, number] => [o.x + Math.cos(o.yaw) * lx + Math.sin(o.yaw) * lz, o.z - Math.sin(o.yaw) * lx + Math.cos(o.yaw) * lz];
const place = (deg: number, r: number) => { const [x, z] = polar(deg, r); return { x, z, yaw: yawToCenter(deg, r) }; };

function TasteScene() {
  const go = useApp((s) => s.go);
  const lib = useLibraryData();
  const language = useTaste((s) => s.language);
  useRoomCamera([0, 1.7, 0], [0, 1.9, -10], 0.3);
  useHint('DRAG TO TURN ALL THE WAY ROUND · SLITS IN THE WALL ARE EXITS');
  const stats = useMemo(() => (lib ? tasteStats(lib, language) : null), [lib, language]);
  const walls = useMemo(() => {
    if (!lib || !stats) return [];
    const angles = [-40, 40, -104, 104];
    return stats.topArtists.filter((a) => a.artist).slice(0, 4).map((a, i) => {
      const songs = lib.songsByArtist.get(a.artist!.id) ?? [];
      const covers = songs.filter((s) => s.coverUrl).sort((x, y) => Number(y.isFavourite) - Number(x.isFavourite)).map((s) => s.coverUrl as string);
      return { artist: a.artist!, count: a.count, covers, deg: angles[i] };
    });
  }, [lib, stats]);

  const deck = place(0, 6.8), piano = place(-72, 6.3), violin = place(72, 6.0);
  const [sx, sz] = at(piano, 0, 1.8), [lx, lz] = at(violin, 0.2, 2.6);
  const years = stats?.years ?? [], maxYear = Math.max(1, ...years.map((y) => y.count));
  const step = 4.6;

  return (
    <group>
      <Colonnade radius={R} height={7.2} count={16} />
      {/* behind you: outlined title and the equaliser skyline of release years along the wall */}
      {(() => { const [x, z] = polar(180, R - 0.8); return <Text position={[x, 6.4, z]} rotation={[0, yawToCenter(180, R - 0.8), 0]} fontSize={1.6} letterSpacing={0.25} fillOpacity={0} strokeWidth={0.016} strokeColor="#ffffff" strokeOpacity={0.9}>TASTE</Text>; })()}
      {(() => { const [x, z] = polar(180, R - 0.8); return <Text position={[x, 5.4, z]} rotation={[0, yawToCenter(180, R - 0.8), 0]} fontSize={0.22} letterSpacing={0.4} color="#7a7a7a">YOUR LISTENING, COMPILED</Text>; })()}
      {!stats && <Text position={[0, 2, -6]} fontSize={0.3} color="#8a8a8a">LOADING…</Text>}
      {stats && stats.total === 0 && <Text position={[0, 2, -6]} fontSize={0.25} letterSpacing={0.15} color="#8a8a8a">NO SONGS IN THIS LANGUAGE</Text>}
      {years.map((y, i) => { const deg = 180 + (i - (years.length - 1) / 2) * step, [x, z] = polar(deg, R - 1.3); return <Bar key={y.label} x={x} z={z} yaw={yawToCenter(deg, R - 1.3)} value={y.count / maxYear} maxH={4.4} width={0.5} label={y.label} count={y.count} phase={i * 0.7} />; })}
      {/* the instruments, one per side */}
      <Turntable position={[deck.x, 0, deck.z]} rotation={[0, deck.yaw, 0]} scale={1.9} />
      <Piano position={[piano.x, 0, piano.z]} rotation={[0, piano.yaw, 0]} scale={1.8} />
      <Violin position={[violin.x, 0, violin.z]} rotation={[0, violin.yaw, 0]} scale={1.15} />
      {/* listeners made of points */}
      <DotPerson position={[sx, 0.25, sz]} rotation={[0, piano.yaw + Math.PI, 0]} pose="sit" scale={1.75} seed={3} />
      <DotPerson position={[lx, 0, lz]} rotation={[0, violin.yaw + Math.PI + 0.3, 0]} pose="stand" scale={1.75} seed={5} phase={1.3} />
      <DotPerson position={[deck.x + 3.2, 0, deck.z + 2.6]} rotation={[0, Math.PI + 0.6, 0]} pose="headphones" scale={1.75} seed={9} phase={2.1} />
      <DotPerson position={[deck.x - 3.0, 0, deck.z + 2.8]} rotation={[0, Math.PI - 0.5, 0]} pose="stand" scale={1.75} seed={11} phase={0.4} />
      <DotPerson position={[polar(166, 5.2)[0], 0, polar(166, 5.2)[1]]} rotation={[0, yawToCenter(166, 5.2) + Math.PI, 0]} pose="headphones" scale={1.75} seed={21} phase={3.3} />
      <DotPerson position={[polar(-166, 5.2)[0], 0, polar(-166, 5.2)[1]]} rotation={[0, yawToCenter(-166, 5.2) + Math.PI, 0]} pose="stand" scale={1.75} seed={23} phase={1.9} />
      {/* top artists hanging between the pillars */}
      {walls.map((w) => { const [x, z] = polar(w.deg, R - 2.2); return (
        <CanvasFrame key={w.artist.id} title={w.artist.name} imageUrl={w.artist.imageUrl} collage={w.covers} maxTiles={4} width={3.4} height={2.1}
          position={[x, 3.1, z]} rotation={[0, yawToCenter(w.deg, R - 2.2), 0]}
          caption={`${w.artist.name} · ${w.count} ${w.count === 1 ? 'song' : 'songs'}`} hoverLabel="OPEN ARTIST" onOpen={() => go(to.artist(w.artist.id))} />
      ); })}
      {/* exits: slits in the wall, behind you */}
      {(() => { const [x, z] = polar(-134, R - 0.9); return <Door label="HEAVEN" position={[x, 0, z]} rotation={[0, yawToCenter(-134, R - 0.9), 0]} cursorLabel="BACK TO HEAVEN" onOpen={() => go(PATHS.heaven)} />; })()}
      {(() => { const [x, z] = polar(134, R - 0.9); return <Door label="DISCOVER" sublabel="NEW MUSIC" position={[x, 0, z]} rotation={[0, yawToCenter(134, R - 0.9), 0]} cursorLabel="GO TO DISCOVER" onOpen={() => go(PATHS.discover)} />; })()}
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
