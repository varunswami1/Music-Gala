// Placeholder rooms so every route works from day one. Replace each with a real room in its owner's folder.
import { Text } from '@react-three/drei';
import type { RoomDef } from '../contract/types';
import { PATHS } from '../contract/routes';
import { useApp, useHint } from '../store/app';
import { useRoomCamera } from '../world/useRoomCamera';
import { WireBox } from '../world/Wire';
import { Door } from '../world/Door';

function stub(id: string, path: string, title: string, note: string, backTo: string = PATHS.heaven): RoomDef {
  function Scene() {
    const go = useApp((s) => s.go);
    useRoomCamera([0, 1.7, 5], [0, 1.7, -8]);
    useHint('PLACEHOLDER ROOM · CLICK THE DOOR TO GO BACK');
    return (
      <group>
        <WireBox size={[12, 6, 24]} position={[0, 3, -8]} />
        <Text position={[0, 3.6, -8]} fontSize={0.6} letterSpacing={0.25} color="#ffffff">{title.toUpperCase()}</Text>
        <Text position={[0, 2.8, -8]} fontSize={0.15} letterSpacing={0.2} color="#8a8a8a" maxWidth={8} textAlign="center">{note}</Text>
        <Door label="BACK" position={[0, 0, -4]} onOpen={() => go(backTo)} />
      </group>
    );
  }
  return { id, path, title, Scene };
}

export { playlistsRoom } from './heaven/Playlists';
export { tasteRoom } from './taste/Taste';
export { discoverRoom } from './discover/Discover';
export const archiveRoom = stub('archive', PATHS.archive, 'Archive', 'Designed later. Record of the effort and the progress of the project.', PATHS.lobby);
