// LIBRARY: one hanging frame per scene room (The Cinema, The Terrace, ...), each with a cover collage. Owner: Person 3.
// Not done: the language filter. The data only has `wing` (desi/global); Person 5 is reconciling language labels with scenes.
import { Text } from '@react-three/drei';
import type { RoomDef } from '../../contract/types';
import { PATHS, to } from '../../contract/routes';
import { useApp, useHint } from '../../store/app';
import { useLibraryData } from '../../data/library';
import { useRoomCamera } from '../../world/useRoomCamera';
import { WireBox } from '../../world/Wire';
import { Door } from '../../world/Door';
import { HangingFrame } from './HangingFrame';

const COLS = 4, SPACING = 3.7, ROW_H = 3.9;

function LibraryScene() {
  const go = useApp((s) => s.go);
  const lib = useLibraryData();
  useRoomCamera([0, 1.7, 5], [0, 1.7, -10]);
  useHint('MOVE THE MOUSE TO LOOK · CLICK A FRAME TO ENTER');
  const rooms = lib?.rooms ?? [];
  const rows = Math.max(1, Math.ceil(rooms.length / COLS));
  const ceiling = rows * ROW_H + 1.2;
  return (
    <group>
      <WireBox size={[18, ceiling, 40]} position={[0, ceiling / 2, -14]} />
      {!lib && <Text position={[0, 2, -8]} fontSize={0.2} letterSpacing={0.15} color="#8a8a8a">LOADING…</Text>}
      {lib && rooms.length === 0 && <Text position={[0, 2, -8]} fontSize={0.2} letterSpacing={0.15} color="#8a8a8a">NO ROOMS IN THE LIBRARY DATA</Text>}
      {rooms.map((r, i) => {
        const row = Math.floor(i / COLS), col = i % COLS;
        const inRow = Math.min(COLS, rooms.length - row * COLS);
        const covers = (lib?.songsByRoom.get(r.id) ?? []).filter((s) => s.coverUrl).slice(0, 9).map((s) => s.coverUrl);
        return (
          <HangingFrame key={r.id} label={r.displayName.toUpperCase()} sublabel={`${r.trackCount} SONGS`} accent={r.accent}
            grid={3} covers={covers} ceilingY={ceiling}
            position={[(col - (inRow - 1) / 2) * SPACING, 2.3 + row * ROW_H, -10 - ((i * 7) % 3) * 1.2]}
            onOpen={() => go(to.libraryRoom(r.id))} />
        );
      })}
      <Door label="HEAVEN" position={[-8, 0, -2]} rotation={[0, 1.2, 0]} onOpen={() => go(PATHS.heaven)} />
    </group>
  );
}
export const libraryRoom: RoomDef = { id: 'library', path: PATHS.library, title: 'Library', Scene: LibraryScene };
