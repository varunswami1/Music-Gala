// DISCOVER: recommendations. Owner: Person 5. Pick a seed song; see "From library" (songs you own) and "New" (outside the
// library, each with a reason). Playback is not offered here: library items open their Song Room, new items open a YouTube Music search.
import { useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { create } from 'zustand';
import { Text } from '@react-three/drei';
import type { RoomDef } from '../../contract/types';
import { PATHS, to } from '../../contract/routes';
import { useApp, useHint } from '../../store/app';
import { useLibraryData } from '../../data/library';
import { getRecommendations, searchUrl, type Rec, type Recommendations } from '../../data/recommend';
import { useRoomCamera } from '../../world/useRoomCamera';
import { WireBox } from '../../world/Wire';
import { Poster } from '../../world/Poster';
import { Door } from '../../world/Door';

type Tab = 'library' | 'new';
interface DiscoverState {
  seedId: string | null; tab: Tab; recs: Recommendations | null; loading: boolean;
  setSeed: (id: string) => void; setTab: (t: Tab) => void; setRecs: (r: Recommendations | null, loading: boolean) => void;
}
const useDiscover = create<DiscoverState>((set) => ({
  seedId: null, tab: 'library', recs: null, loading: false,
  setSeed: (seedId) => set({ seedId }), setTab: (tab) => set({ tab }), setRecs: (recs, loading) => set({ recs, loading }),
}));

const SHOWN = 7;

function DiscoverScene() {
  const go = useApp((s) => s.go);
  const { tab, recs, loading, seedId } = useDiscover();
  useRoomCamera([0, 1.8, 4], [0, 2, -6], 0.3);
  const list: Rec[] = (tab === 'library' ? recs?.fromLibrary : recs?.outside) ?? [];
  const shown = list.slice(0, SHOWN);
  useHint(shown.length ? 'CLICK A COVER · FULL LIST ON THE RIGHT' : 'PICK A SONG ON THE LEFT TO SEE WHAT FITS');

  return (
    <group>
      <WireBox size={[20, 7, 24]} position={[0, 3.5, -2]} />
      <Text position={[0, 6, -11]} fontSize={0.5} letterSpacing={0.3} color="#ffffff">DISCOVER</Text>
      {shown.map((r, i) => {
        const a = (i - (shown.length - 1) / 2) * 0.42;           // fan out around the camera
        const radius = 7;
        return (
          <Poster
            key={`${seedId}-${tab}-${i}-${r.title}`} title={r.title} coverUrl={r.coverUrl} size={1.7}
            position={[Math.sin(a) * radius, 2.3, 4 - Math.cos(a) * radius]} rotation={[0, -a, 0]}
            caption={`${r.title} · ${r.artist}`}
            hoverLabel={r.songId ? 'OPEN SONG' : 'SEARCH YT MUSIC'}
            onOpen={() => { if (r.songId) go(to.song(r.songId)); else window.open(searchUrl(r), '_blank', 'noopener,noreferrer'); }}
          />
        );
      })}
      {!shown.length && (
        <Text position={[0, 2.2, -5]} fontSize={0.17} letterSpacing={0.15} color="#8a8a8a" maxWidth={9} textAlign="center">
          {loading ? 'LOOKING…' : tab === 'new' && recs && !recs.outsideAvailable ? 'NO OUTSIDE SUGGESTIONS YET' : seedId ? 'NOTHING FITS THIS SONG YET' : 'NO SONG PICKED'}
        </Text>
      )}
      <Door label="HEAVEN" position={[0, 0, 10.2]} rotation={[0, Math.PI, 0]} cursorLabel="BACK TO HEAVEN" onOpen={() => go(PATHS.heaven)} />
    </group>
  );
}

function DiscoverPanels() {
  const lib = useLibraryData();
  const lastSongId = useApp((s) => s.lastSongId);
  const { seedId, tab, recs, loading, setSeed, setTab, setRecs } = useDiscover();

  // Seeds: favourites first, then anything with a cover. Capped so the list stays light with 6,000 songs.
  const seeds = useMemo(() => {
    if (!lib) return [];
    const ranked = [...lib.songs].sort((a, b) => Number(b.isFavourite) - Number(a.isFavourite) || Number(!!b.coverUrl) - Number(!!a.coverUrl));
    return ranked.slice(0, 60);
  }, [lib]);

  // Default seed: the song you were just looking at, otherwise the first seed. Never overrides a choice already made.
  useEffect(() => {
    if (!lib || seedId) return;
    const start = (lastSongId && lib.songsById.has(lastSongId) ? lastSongId : seeds[0]?.id) ?? null;
    if (start) setSeed(start);
  }, [lib, seedId, lastSongId, seeds, setSeed]);

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
              <span>{s.title}<br /><small>{s.artistNames.join(', ') || '—'}</small></span>
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
                ? <>NO OUTSIDE SUGGESTIONS YET<br />RUN scripts/build_recs.py</>
                : 'NOTHING FITS THIS SONG YET'}
            </div>
          )}
          {list.map((r, i) => {
            const body = <span>{r.title}<br /><small>{r.artist}</small><br /><small>{r.reason}{r.inLibrary && tab === 'new' ? ' · ALREADY IN YOUR LIBRARY' : ''}</small></span>;
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
