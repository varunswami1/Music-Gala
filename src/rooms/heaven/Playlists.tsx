// PLAYLISTS: a corridor with one gate per playlist; entering one shows its songs in the same layered round room. Owner: Person 3.
// Opening a playlist is local state (see CHANGELOG: the contract has no playlist route). Esc or the breadcrumb goes back.
import { useEffect, useMemo } from 'react';
import type { RoomDef } from '../../contract/types';
import { PATHS } from '../../contract/routes';
import { WireCylinder } from '../../world/Wire';
import { Corridor, type GateItem } from './Corridor';
import { CardRing, RING_EYE_Y, RING_RADIUS } from './CardRing';
import { RoomVestibule } from './Vestibule';
import { useFixedCamera } from './camera';
import { tunnelDo } from './tunnel';
import { usePlaylists, usePlaylistView, type Playlist } from './playlistsStore';

const ACCENT = '#cfcfcf';
const EYE: [number, number, number] = [0, RING_EYE_Y, 0];
const LOOK: [number, number, number] = [0, RING_EYE_Y, -1];

function PlaylistRing({ playlist }: { playlist: Playlist }) {
  useFixedCamera(EYE, LOOK);
  return (
    <group>
      <WireCylinder radius={RING_RADIUS} height={8} position={[0, 4, 0]} color={ACCENT} opacity={0.25} segments={48} />
      <RoomVestibule wallZ={RING_RADIUS} />
      <CardRing songs={playlist.songs} accent={ACCENT} />
    </group>
  );
}

function PlaylistsScene() {
  const { status, playlists } = usePlaylists();
  const selectedId = usePlaylistView((s) => s.selectedId);
  useEffect(() => () => usePlaylistView.getState().select(null), []);
  const items = useMemo<GateItem[]>(() => playlists.map((p) => ({
    id: p.id, label: p.displayName, sub: p.subtitle, accent: ACCENT,
    covers: p.songs.filter((s) => s.coverUrl).slice(0, 9).map((s) => s.coverUrl),
    onOpen: () => tunnelDo(() => usePlaylistView.getState().select(p.id, p.displayName), p.displayName),
  })), [playlists]);
  const selected = playlists.find((p) => p.id === selectedId);
  if (selected) return <PlaylistRing key={selected.id} playlist={selected} />;
  const msg = status === 'error' ? 'PLAYLIST DATA UNAVAILABLE' : status === 'loading' ? 'LOADING…' : playlists.length === 0 ? 'NO PLAYLISTS IN THE LIBRARY DATA' : '';
  const ambient = playlists.flatMap((p) => p.songs.filter((s) => s.coverUrl).slice(0, 2).map((s) => s.coverUrl as string)).slice(0, 24);
  return <Corridor key="overview" items={items} grid={3} ambient={ambient} emptyText={msg} />;
}

export const playlistsRoom: RoomDef = { id: 'playlists', path: PATHS.playlists, title: 'Playlists', Scene: PlaylistsScene };
