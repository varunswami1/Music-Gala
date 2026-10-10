// A scene room (e.g. The Cinema) shown as a wide cylinder of cards. Owner: Person 3.
import { Text } from '@react-three/drei';
import type { RoomDef, RoomProps, Song } from '../../contract/types';
import { PATHS } from '../../contract/routes';
import { useApp } from '../../store/app';
import { useLibraryData } from '../../data/library';
import { useRoomCamera } from '../../world/useRoomCamera';
import { WireCylinder } from '../../world/Wire';
import { Door } from '../../world/Door';
import { CardRing } from './CardRing';
import { RingControls } from './RingControls';

const NONE: Song[] = []; // stable reference so the ring does not re-group on every render

function LibraryRoomScene({ params }: RoomProps) {
  const go = useApp((s) => s.go);
  const lib = useLibraryData();
  useRoomCamera([0, 1.9, 0], [0, 1.9, -1], 0.7);
  const room = lib?.rooms.find((r) => r.id === params.roomId);
  const songs = (room && lib?.songsByRoom.get(room.id)) || NONE;
  return (
    <group>
      <WireCylinder radius={9.5} height={8} position={[0, 4, 0]} color={room?.accent ?? '#ffffff'} />
      {!lib && <Text position={[0, 2, -5]} fontSize={0.25} color="#8a8a8a">LOADING…</Text>}
      {lib && !room && <Text position={[0, 2, -5]} fontSize={0.25} color="#8a8a8a">UNKNOWN ROOM</Text>}
      {room && <CardRing songs={songs} accent={room.accent} />}
      <Door label="BACK TO LIBRARY" position={[0, 0, 8.4]} rotation={[0, Math.PI, 0]} cursorLabel="BACK TO LIBRARY" onOpen={() => go(PATHS.library)} />
    </group>
  );
}

function LibraryRoomPanels({ params }: RoomProps) {
  const lib = useLibraryData();
  const room = lib?.rooms.find((r) => r.id === params.roomId);
  if (!room) return null;
  return (
    <div className="panel left">
      <div className="eyebrow">LIBRARY</div>
      <h1>{room.displayName}</h1>
      <div className="eyebrow">{lib?.songsByRoom.get(room.id)?.length ?? 0} SONGS</div>
      <RingControls />
    </div>
  );
}
export const libraryRoomRoom: RoomDef = { id: 'library-room', path: PATHS.libraryRoom, title: 'Library room', Scene: LibraryRoomScene, Panels: LibraryRoomPanels };
