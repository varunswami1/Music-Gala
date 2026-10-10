// PLAYLISTS: your own collections as hanging frames; opening one shows its songs in the card ring (same pattern as Library).
// Owner: Person 3.
import { useEffect } from 'react';
import { Text } from '@react-three/drei';
import type { RoomDef } from '../../contract/types';
import { PATHS } from '../../contract/routes';
import { useApp, useHint } from '../../store/app';
import { useRoomCamera } from '../../world/useRoomCamera';
import { WireBox, WireCylinder } from '../../world/Wire';
import { Door } from '../../world/Door';
import { HangingFrame } from './HangingFrame';
import { CardRing } from './CardRing';
import { RingControls } from './RingControls';
import { usePlaylists, usePlaylistView, frameLabel, PAGE_SIZE, type Playlist } from './playlistsStore';

const COLS = 4, SPACING = 3.7, ROW_H = 3.9, ACCENT = '#cfcfcf';

const typing = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement | null;
  return !!t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable);
};

function Overview({ status, all }: { status: string; all: Playlist[] }) {
  const go = useApp((s) => s.go);
  const select = usePlaylistView((s) => s.select);
  const page = usePlaylistView((s) => s.page);
  const pages = Math.max(1, Math.ceil(all.length / PAGE_SIZE));
  const cur = Math.min(page, pages - 1);
  const playlists = all.slice(cur * PAGE_SIZE, (cur + 1) * PAGE_SIZE);
  useRoomCamera([0, 1.7, 5], [0, 1.7, -10]);
  useHint(all.length
    ? `MOVE THE MOUSE TO LOOK · CLICK A FRAME TO OPEN${pages > 1 ? ` · ← → PAGE ${cur + 1}/${pages}` : ''}`
    : 'MOVE THE MOUSE TO LOOK');
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (typing(e) || e.metaKey || e.ctrlKey || e.altKey) return;
      const v = usePlaylistView.getState();
      if (e.key === 'ArrowRight') v.setPage(Math.min(pages - 1, v.page + 1));
      else if (e.key === 'ArrowLeft') v.setPage(v.page - 1);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [pages]);
  const rows = Math.max(1, Math.ceil(playlists.length / COLS));
  const ceiling = rows * ROW_H + 1.2;
  const msg = status === 'error' ? 'PLAYLIST DATA UNAVAILABLE'
    : status === 'loading' ? 'LOADING…'
    : all.length === 0 ? 'NO PLAYLISTS IN THE LIBRARY DATA' : '';
  return (
    <group>
      <WireBox size={[18, ceiling, 40]} position={[0, ceiling / 2, -14]} />
      {msg && <Text position={[0, 2, -8]} fontSize={0.2} letterSpacing={0.15} color="#8a8a8a">{msg}</Text>}
      {playlists.map((p, i) => {
        const row = Math.floor(i / COLS), col = i % COLS;
        const inRow = Math.min(COLS, playlists.length - row * COLS);
        return (
          <HangingFrame key={p.id} label={frameLabel(p.displayName)} sublabel={p.subtitle} accent={ACCENT} grid={3}
            covers={p.songs.filter((s) => s.coverUrl).slice(0, 9).map((s) => s.coverUrl)} ceilingY={ceiling}
            position={[(col - (inRow - 1) / 2) * SPACING, 2.3 + row * ROW_H, -10 - ((i * 7) % 3) * 1.2]}
            onOpen={() => select(p.id)} />
        );
      })}
      <Door label="HEAVEN" position={[-8, 0, -2]} rotation={[0, 1.2, 0]} onOpen={() => go(PATHS.heaven)} />
    </group>
  );
}

function PlaylistRing({ playlist }: { playlist: Playlist }) {
  const select = usePlaylistView((s) => s.select);
  useRoomCamera([0, 1.9, 0], [0, 1.9, -1], 0.7);
  return (
    <group>
      <WireCylinder radius={9.5} height={8} position={[0, 4, 0]} color={ACCENT} />
      <CardRing songs={playlist.songs} accent={ACCENT} />
      <Door label="BACK TO PLAYLISTS" position={[0, 0, 8.4]} rotation={[0, Math.PI, 0]} cursorLabel="BACK TO PLAYLISTS" onOpen={() => select(null)} />
    </group>
  );
}

function PlaylistsScene() {
  const { status, playlists } = usePlaylists();
  const selectedId = usePlaylistView((s) => s.selectedId);
  useEffect(() => () => { usePlaylistView.getState().select(null); usePlaylistView.getState().setPage(0); }, []);
  const selected = playlists.find((p) => p.id === selectedId);
  // key forces a clean remount (fresh camera + ring state) when switching between overview and a playlist
  return selected ? <PlaylistRing key={selected.id} playlist={selected} /> : <Overview key="overview" status={status} all={playlists} />;
}

function PlaylistsPanels() {
  const { playlists } = usePlaylists();
  const selectedId = usePlaylistView((s) => s.selectedId);
  const select = usePlaylistView((s) => s.select);
  const page = usePlaylistView((s) => s.page);
  const setPage = usePlaylistView((s) => s.setPage);
  const pages = Math.max(1, Math.ceil(playlists.length / PAGE_SIZE));
  const cur = Math.min(page, pages - 1);
  const selected = playlists.find((p) => p.id === selectedId);
  if (selected) {
    return (
      <div className="panel left">
        <div className="eyebrow">PLAYLIST</div>
        <h1>{selected.displayName}</h1>
        <div className="eyebrow">{selected.subtitle}</div>
        <button type="button" className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => select(null)}>ALL PLAYLISTS</button>
        <RingControls />
      </div>
    );
  }
  return (
    <div className="panel left" style={{ bottom: 'auto' }}>
      <div className="eyebrow">PLAYLISTS</div>
      <h1>Your collections</h1>
      <div className="eyebrow">{playlists.length} PLAYLISTS</div>
      {pages > 1 && (
        <div style={{ display: 'flex', gap: 18, marginTop: 14, alignItems: 'center' }}>
          <button type="button" disabled={cur === 0} onClick={() => setPage(cur - 1)}>← PREV</button>
          <span className="eyebrow">PAGE {cur + 1} / {pages}</span>
          <button type="button" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>NEXT →</button>
        </div>
      )}
    </div>
  );
}

export const playlistsRoom: RoomDef = { id: 'playlists', path: PATHS.playlists, title: 'Playlists', Scene: PlaylistsScene, Panels: PlaylistsPanels };
