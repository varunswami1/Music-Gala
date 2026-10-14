// A scene room (e.g. The Cinema): a round room of layered album cards. Owner: Person 3.
// No side panel: the room name is in the top breadcrumb, controls are on the hint line, search is top-left.
import { Text } from '@react-three/drei';
import type { RoomDef, RoomProps, Song } from '../../contract/types';
import { PATHS } from '../../contract/routes';
import { useLibraryData } from '../../data/library';
import { WireCylinder } from '../../world/Wire';
import { CardRing, RING_EYE_Y, RING_RADIUS } from './CardRing';
import { RoomVestibule } from './Vestibule';
import { useFixedCamera } from './camera';

const NONE: Song[] = []; // stable reference so the ring does not re-group on every render
const EYE: [number, number, number] = [0, RING_EYE_Y, 0];
const LOOK: [number, number, number] = [0, RING_EYE_Y, -1];

function LibraryRoomScene({ params }: RoomProps) {
  const lib = useLibraryData();
  useFixedCamera(EYE, LOOK);
  const room = lib?.rooms.find((r) => r.id === params.roomId);
  const songs = (room && lib?.songsByRoom.get(room.id)) || NONE;
  return (
    <group>
      <WireCylinder radius={RING_RADIUS} height={8} position={[0, 4, 0]} color={room?.accent ?? '#ffffff'} opacity={0.25} segments={48} />
      <RoomVestibule wallZ={RING_RADIUS} />
      {!lib && <Text position={[0, RING_EYE_Y, -5]} fontSize={0.25} color="#8a8a8a">LOADING…</Text>}
      {lib && !room && <Text position={[0, RING_EYE_Y, -5]} fontSize={0.25} color="#8a8a8a">UNKNOWN ROOM</Text>}
      {room && <CardRing songs={songs} accent={room.accent} />}
    </group>
  );
}
export const libraryRoomRoom: RoomDef = { id: 'library-room', path: PATHS.libraryRoom, title: 'Library room', Scene: LibraryRoomScene };
