// HEAVEN: the main hub (the gallery). Owner: Person 3.
// Four hanging frames (Taste, Library, Discover, Playlists) at different depths, drifting covers behind them,
// doors to Lobby and Archive. Frames show covers from the library; with no data they show calm dark tiles.
// Not done here (Person 1 owns the camera): scroll-to-move.
import { useMemo } from 'react';
import type { RoomDef } from '../../contract/types';
import { PATHS } from '../../contract/routes';
import { useApp, useHint } from '../../store/app';
import { useLibraryData } from '../../data/library';
import { useRoomCamera } from '../../world/useRoomCamera';
import { WireBox } from '../../world/Wire';
import { Door } from '../../world/Door';
import { HangingFrame } from './HangingFrame';
import { DriftingCovers } from './DriftingCovers';

const CEILING = 6;
const AREAS = [
  ['TASTE', PATHS.taste, 'YOUR LISTENING, SUMMED UP', 0],
  ['LIBRARY', PATHS.library, 'EVERY SONG, BY SCENE', 4],
  ['DISCOVER', PATHS.discover, 'NEW SONGS FOR YOU', 8],
  ['PLAYLISTS', PATHS.playlists, 'YOUR OWN COLLECTIONS', 12],
] as const;

function HeavenScene() {
  const go = useApp((s) => s.go);
  const lib = useLibraryData();
  useRoomCamera([0, 1.7, 5], [0, 1.7, -10]);
  useHint('MOVE THE MOUSE TO LOOK · CLICK A FRAME OR DOOR');

  // Covers for frames and drifters: pick evenly across the library so each frame looks different.
  const covers = useMemo(() => {
    const withCover = (lib?.songs ?? []).filter((s) => s.coverUrl).map((s) => s.coverUrl as string);
    const step = Math.max(1, Math.floor(withCover.length / 40));
    return Array.from({ length: Math.min(40, withCover.length) }, (_, i) => withCover[i * step]);
  }, [lib]);
  const drift = useMemo(() => covers.slice(16, 28), [covers]);

  return (
    <group>
      <WireBox size={[18, CEILING, 40]} position={[0, CEILING / 2, -14]} />
      <DriftingCovers urls={drift} />
      {AREAS.map(([label, path, sub, offset], i) => (
        <HangingFrame key={label} label={label} sublabel={sub} ceilingY={CEILING}
          position={[(i - 1.5) * 3.8, 2.7 + (i % 2) * 0.25, -9 - (i % 2) * 2.2]}
          covers={covers.slice(offset, offset + 4)} onOpen={() => go(path)} />
      ))}
      <Door label="LOBBY" position={[-7.5, 0, -2]} rotation={[0, 1.2, 0]} onOpen={() => go(PATHS.lobby)} />
      <Door label="ARCHIVE" position={[7.5, 0, -2]} rotation={[0, -1.2, 0]} onOpen={() => go(PATHS.archive)} />
    </group>
  );
}
export const heavenRoom: RoomDef = { id: 'heaven', path: PATHS.heaven, title: 'Heaven', Scene: HeavenScene };
