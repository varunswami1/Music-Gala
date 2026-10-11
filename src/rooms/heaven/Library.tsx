// LIBRARY: a corridor with one big gate per scene room (The Cinema, The Terrace, ...), each showing a 3x3 cover collage. Owner: Person 3.
// Not done: the language filter. The data only has `wing` (desi/global); Person 5 is reconciling language labels with scenes.
import { useMemo } from 'react';
import type { RoomDef } from '../../contract/types';
import { PATHS, to } from '../../contract/routes';
import { useLibraryData } from '../../data/library';
import { Corridor, type GateItem } from './Corridor';
import { tunnelGo } from './tunnel';

function LibraryScene() {
  const lib = useLibraryData();
  const items = useMemo<GateItem[]>(() => (lib?.rooms ?? []).map((r) => ({
    id: r.id, label: r.displayName, sub: `${r.trackCount} SONGS`, accent: r.accent,
    covers: (lib?.songsByRoom.get(r.id) ?? []).filter((s) => s.coverUrl).slice(0, 9).map((s) => s.coverUrl),
    onOpen: () => tunnelGo(to.libraryRoom(r.id), r.displayName),
  })), [lib]);
  return <Corridor items={items} grid={3} emptyText={!lib ? 'LOADING…' : 'NO ROOMS IN THE LIBRARY DATA'} />;
}
export const libraryRoom: RoomDef = { id: 'library', path: PATHS.library, title: 'Library', Scene: LibraryScene };
