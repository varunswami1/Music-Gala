// DISCOVER: recommendations. Owner: Person 5. A round colonnade with you in the middle: suggestions hang in a ring around you
// (turn all the way round), props stand below them, and slits in the wall lead back to Heaven and over to Taste.
// "From library" = songs you own; "New" = outside suggestions, each with a reason. Library items open their Song Room;
// new items open a YouTube Music search (nothing is played from here).
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { create } from 'zustand';
import { Text } from '@react-three/drei';
import type { RoomDef } from '../../contract/types';
import { PATHS, to } from '../../contract/routes';
import { useApp, useHint } from '../../store/app';
import { useLibraryData } from '../../data/library';
import { getRecommendations, hasOutside, searchUrl, warmRecommendations, type Rec, type Recommendations } from '../../data/recommend';
import { useRoomCamera } from '../../world/useRoomCamera';
import { Colonnade } from '../../world/Colonnade';
import { CanvasFrame } from '../../world/CanvasFrame';
import { Door } from '../../world/Door';
import { polar, yawToCenter } from '../../world/ring';
import { DotPerson } from '../taste/props';
import { Armillary, Boombox, Cassette, Headphones } from './props';

type Tab = 'library' | 'new';
interface DiscoverState {
  seedId: string | null; tab: Tab; recs: Recommendations | null; loading: boolean;
  setSeed: (id: string) => void; setTab: (t: Tab) => void; setRecs: (r: Recommendations | null, loading: boolean) => void;
}
const useDiscover = create<DiscoverState>((set) => ({
  seedId: null, tab: 'library', recs: null, loading: false,
  setSeed: (seedId) => set({ seedId }), setTab: (tab) => set({ tab }), setRecs: (recs, loading) => set({ recs, loading }),
}));

const SHOWN = 12, R = 10.5, RING = 8.0;
const open = (r: Rec, go: (p: string) => void) => { if (r.songId) go(to.song(r.songId)); else window.open(searchUrl(r), '_blank', 'noopener,noreferrer'); };

function DiscoverScene() {
  const go = useApp((s) => s.go);
  const lib = useLibraryData();
  const { tab, recs, loading, seedId } = useDiscover();
  useRoomCamera([0, 1.7, 0], [0, 2.2, -10], 0.3);
  const list: Rec[] = (tab === 'library' ? recs?.fromLibrary : recs?.outside) ?? [];
  const shown = list.slice(0, SHOWN);
  const seed = lib && seedId ? lib.songsById.get(seedId) : undefined;
  const step = shown.length > 1 ? Math.min(30, 210 / (shown.length - 1)) : 0;   // the ring spans at most ±105°, so the back stays free for the exits and the seed
  const fw = shown.length > 9 ? 2.2 : 2.5;
  useHint(shown.length ? 'DRAG TO TURN ALL THE WAY ROUND · CLICK A FRAME · FULL LIST ON THE RIGHT' : 'PICK A SONG ON THE LEFT TO SEE WHAT FITS');
  const empty = loading ? 'LOOKING…' : tab === 'new' && recs && !recs.outsideAvailable ? 'NO OUTSIDE SUGGESTIONS YET' : tab === 'new' && recs ? 'NO NEW SUGGESTIONS FOR THIS ARTIST' : seedId ? 'NOTHING FITS THIS SONG YET' : 'NO SONG PICKED';
  const ph = useMemo(() => polar(40, 5.2), []), bb = useMemo(() => polar(-42, 5.6), []), cs = useMemo(() => polar(166, 5.4), []), ar = useMemo(() => polar(-166, 5.2), []);
  const exitA = polar(-134, R - 0.9), exitB = polar(134, R - 0.9);

  return (
    <group>
      <Colonnade radius={R} height={7.2} count={16} />
      {/* suggestions hang in a ring around you, starting from the left of straight ahead */}
      {shown.map((r, i) => { const deg = (i - (shown.length - 1) / 2) * step, [x, z] = polar(deg, RING); return (
        <CanvasFrame key={`${seedId}-${tab}-${i}-${r.title}`} title={r.title} imageUrl={r.coverUrl} width={fw} height={fw}
          fallbackText={r.kind === 'artist' ? `${r.title}\nARTIST` : `${r.title}\n${r.artist}`}
          position={[x, 3.4, z]} rotation={[0, yawToCenter(deg, RING), 0]} caption={`${r.title} · ${r.artist}`}
          hoverLabel={r.songId ? 'OPEN SONG' : 'SEARCH YT MUSIC'} onOpen={() => open(r, go)} />
      ); })}
      {/* behind you: where you started from */}
      {seed && (() => { const [x, z] = polar(180, RING + 0.4); return (
        <>
          <Text position={[x, 6.3, z]} rotation={[0, yawToCenter(180, RING), 0]} fontSize={0.22} letterSpacing={0.4} color="#8a8a8a">STARTED FROM</Text>
          <CanvasFrame title={seed.title} imageUrl={seed.coverUrl} width={3.2} height={3.2} fallbackText={`${seed.title}\n${seed.artistNames.join(', ')}`}
            position={[x, 3.2, z]} rotation={[0, yawToCenter(180, RING), 0]} caption={`${seed.title} · ${seed.artistNames.join(', ')}`} hoverLabel="OPEN SONG" onOpen={() => go(to.song(seed.id))} />
        </>
      ); })()}
      {!shown.length && <Text position={[0, 2.2, -6]} fontSize={0.2} letterSpacing={0.15} color="#8a8a8a" maxWidth={9} textAlign="center">{empty}</Text>}
      {/* props stand below the frames, all the way round */}
      <Headphones position={[ph[0], 0, ph[1]]} rotation={[0, yawToCenter(40, 5.2), 0]} />
      <Boombox position={[bb[0], 0, bb[1]]} rotation={[0, yawToCenter(-42, 5.6), 0]} />
      <Cassette position={[cs[0], 0, cs[1]]} rotation={[0, yawToCenter(166, 5.4), 0]} />
      <Armillary position={[ar[0], 0, ar[1]]} />
      <DotPerson position={[polar(-20, 5.5)[0], 0, polar(-20, 5.5)[1]]} rotation={[0, yawToCenter(-20, 5.5) + Math.PI, 0]} pose="headphones" scale={1.75} seed={31} phase={0.8} />
      <DotPerson position={[polar(22, 5.0)[0], 0, polar(22, 5.0)[1]]} rotation={[0, yawToCenter(22, 5.0) + Math.PI, 0]} pose="stand" scale={1.75} seed={33} phase={2.6} />
      <DotPerson position={[polar(112, 5.6)[0], 0, polar(112, 5.6)[1]]} rotation={[0, yawToCenter(112, 5.6) + Math.PI, 0]} pose="stand" scale={1.75} seed={35} phase={1.4} />
      {/* exits: slits in the wall, behind you */}
      <Door label="HEAVEN" position={[exitA[0], 0, exitA[1]]} rotation={[0, yawToCenter(-134, R - 0.9), 0]} cursorLabel="BACK TO HEAVEN" onOpen={() => go(PATHS.heaven)} />
      <Door label="TASTE" sublabel="YOUR LISTENING" position={[exitB[0], 0, exitB[1]]} rotation={[0, yawToCenter(134, R - 0.9), 0]} cursorLabel="GO TO TASTE" onOpen={() => go(PATHS.taste)} />
    </group>
  );
}

function DiscoverPanels() {
  const lib = useLibraryData();
  const lastSongId = useApp((s) => s.lastSongId);
  const { seedId, tab, recs, loading, setSeed, setTab, setRecs } = useDiscover();
  const [ready, setReady] = useState(false);
  useEffect(() => { warmRecommendations().then(() => setReady(true)); }, []);

  // Seeds: favourites first, then anything with a cover. Capped so the list stays light with 6,000 songs.
  const seeds = useMemo(() => {
    if (!lib) return [];
    // songs with "New" suggestions first, then favourites, then anything with a cover
    const ranked = [...lib.songs].sort((a, b) => Number(hasOutside(b)) - Number(hasOutside(a)) || Number(b.isFavourite) - Number(a.isFavourite) || Number(!!b.coverUrl) - Number(!!a.coverUrl));
    return ranked.slice(0, 60);
  }, [lib, ready]);

  // Default seed: the song you were just looking at, otherwise the first seed. Never overrides a choice already made.
  useEffect(() => {
    if (!lib || seedId || !ready) return;
    const start = (lastSongId && lib.songsById.has(lastSongId) ? lastSongId : seeds[0]?.id) ?? null;
    if (start) setSeed(start);
  }, [lib, seedId, ready, lastSongId, seeds, setSeed]);

  useEffect(() => {
    const seed = lib && seedId ? lib.songsById.get(seedId) : undefined;
    if (!lib || !seed) { setRecs(null, false); return; }
    let live = true;
    setRecs(null, true);
    getRecommendations(lib, seed).then((r) => { if (live) setRecs(r, false); }).catch(() => { if (live) setRecs({ fromLibrary: [], outside: [], outsideAvailable: false }, false); });
    return () => { live = false; };
  }, [lib, seedId, setRecs]);

  if (!lib) return null;
  const seed = seedId ? lib.songsById.get(seedId) : undefined;
  const list = (tab === 'library' ? recs?.fromLibrary : recs?.outside) ?? [];
  const tabBtn = (t: Tab, label: string, n: number | null) => (
    <button style={{ opacity: tab === t ? 1 : 0.5, borderBottom: tab === t ? '1px solid #fff' : '1px solid transparent', padding: '4px 0' }} onClick={() => setTab(t)} aria-pressed={tab === t}>
      {label}{n !== null ? ` · ${n}` : ''}
    </button>
  );
  return (
    <>
      <aside className="panel left">
        <div className="eyebrow">DISCOVER</div>
        <h1>{seed ? seed.title : 'Pick a song'}</h1>
        <div className="eyebrow">{seed ? seed.artistNames.join(', ') || 'UNKNOWN ARTIST' : 'NO SONGS IN THE LIBRARY'}</div>
        <div className="eyebrow" style={{ marginTop: 18 }}>START FROM</div>
        <div className="list">
          {seeds.map((s) => (
            <button key={s.id} className="row" style={{ display: 'grid', width: '100%', gridTemplateColumns: '1fr', textAlign: 'left', letterSpacing: 'inherit', opacity: s.id === seedId ? 1 : 0.6 }} onClick={() => setSeed(s.id)} aria-pressed={s.id === seedId}>
              <span>{s.title}{hasOutside(s) ? ' ·' : ''}<br /><small>{s.artistNames.join(', ') || '—'}{hasOutside(s) ? ' · HAS NEW SUGGESTIONS' : ''}</small></span>
            </button>
          ))}
        </div>
      </aside>
      <aside className="panel right">
        <div style={{ display: 'flex', gap: 22 }}>
          {tabBtn('library', 'FROM LIBRARY', recs ? recs.fromLibrary.length : null)}
          {tabBtn('new', 'NEW', recs ? recs.outside.length : null)}
        </div>
        <div className="list">
          {loading && <div className="eyebrow" style={{ paddingTop: 12 }}>LOOKING…</div>}
          {!loading && list.length === 0 && (
            <div className="eyebrow" style={{ paddingTop: 12, lineHeight: 1.9 }}>
              {tab === 'new' && recs && !recs.outsideAvailable
                ? <>NO OUTSIDE SUGGESTIONS YET<br />RUN scripts/build_recs_from_profiles.py</>
                : tab === 'new' && recs?.outsideAvailable ? <>NO NEW SUGGESTIONS FOR THIS ARTIST<br />PICK A SONG MARKED “HAS NEW SUGGESTIONS”</> : 'NOTHING FITS THIS SONG YET'}
            </div>
          )}
          {list.map((r, i) => {
            const kindTag = r.kind === 'artist' ? 'ARTIST · ' : '';
            const body = <span>{kindTag}{r.title}<br /><small>{r.kind === 'artist' ? '' : r.artist}</small><br /><small>{r.reason}{r.inLibrary && tab === 'new' ? ' · ALREADY IN YOUR LIBRARY' : ''}</small></span>;
            const img = r.coverUrl ? <img src={r.coverUrl} alt="" loading="lazy" /> : <span />;
            return r.songId
              ? <Link key={`${i}-${r.title}`} className="row" to={to.song(r.songId)}>{body}{img}</Link>
              : <a key={`${i}-${r.title}`} className="row" href={searchUrl(r)} target="_blank" rel="noopener noreferrer">{body}{img}</a>;
          })}
        </div>
      </aside>
    </>
  );
}

export const discoverRoom: RoomDef = { id: 'discover', path: PATHS.discover, title: 'Discover', Scene: DiscoverScene, Panels: DiscoverPanels };
