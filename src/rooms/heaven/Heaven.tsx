// HEAVEN: the hub, a corridor with one big gate per area (Library, Playlists, Discover, Taste). Owner: Person 3.
// Walk with ↑ ↓; far gates are dark, near ones show details; click (or Enter) to go through the tunnel.
// The top navigation bar (HeavenNav) is mounted once in App, not here.
import { useMemo } from 'react';
import type { RoomDef } from '../../contract/types';
import { PATHS } from '../../contract/routes';
import { useLibraryData } from '../../data/library';
import { Corridor, type GateItem } from './Corridor';
import { tunnelGo } from './tunnel';

function HeavenScene() {
  const lib = useLibraryData();
  const covers = useMemo(() => {
    const all = (lib?.songs ?? []).filter((s) => s.coverUrl).map((s) => s.coverUrl as string);
    const step = Math.max(1, Math.floor(all.length / 16));
    return Array.from({ length: Math.min(16, all.length) }, (_, i) => all[i * step]);
  }, [lib]);
  const items = useMemo<GateItem[]>(() => [
    ['library', 'LIBRARY', 'EVERY SONG, BY SCENE', PATHS.library],
    ['playlists', 'PLAYLISTS', 'YOUR OWN COLLECTIONS', PATHS.playlists],
    ['discover', 'DISCOVER', 'NEW SONGS FOR YOU', PATHS.discover],
    ['taste', 'TASTE', 'YOUR LISTENING, SUMMED UP', PATHS.taste],
  ].map(([id, label, sub, path], i) => ({
    id, label, sub, covers: covers.slice(i * 4, i * 4 + 4), onOpen: () => tunnelGo(path, label),
  })), [covers]);
  return <Corridor items={items} grid={2} />;
}
export const heavenRoom: RoomDef = { id: 'heaven', path: PATHS.heaven, title: 'Heaven', Scene: HeavenScene };
