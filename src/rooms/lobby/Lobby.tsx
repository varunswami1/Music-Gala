// LOBBY. Owner: Person 2.
// Borrowed from the reference (docs/reference/05-lobby): the dotted columns down a long hall, a big lit screen at the far end with
// the doors in front of it, and floating door signs. Everything else here (instruments, text, models) is our own.
// A dark hall of wireframe and point-cloud instruments that says "this is a music site", a clear title and tagline,
// and two doors: the Gallery (Heaven) straight ahead and the Studio on the left.
// Every model is built in code (see models/), so there are no asset files or licences to track.
import { Link } from 'react-router-dom';
import { Text } from '@react-three/drei';
import type { RoomDef } from '../../contract/types';
import { PATHS } from '../../contract/routes';
import { useApp, useHint } from '../../store/app';
import { useLibraryData } from '../../data/library';
import { useRoomCamera } from '../../world/useRoomCamera';
import { WireBox } from '../../world/Wire';
import { Door } from '../../world/Door';
import { Model } from './models/Model';
import { EqualizerScreen, FloorPulse, Ring } from './models/effects';
import type { V3 } from './models/build';

const COLUMN_Z = [-2, -8, -14, -20, -26];

/** An exhibit: model, floor ring and a small caption. `facing` is the rotation about Y that turns the front towards the visitor. */
function Exhibit({ label, kind, position, facing, points, ringRadius = 1.1, captionOffset = [0, 0.12, 1.2], ...rest }: {
  label: string; kind: 'piano' | 'guitar' | 'violin' | 'turntable'; position: V3; facing: number; points: number;
  ringRadius?: number; captionOffset?: V3; sway?: number; phase?: number; seed?: number;
}) {
  return (
    <group>
      <Model kind={kind} position={position} rotation={[0, facing, 0]} points={points} wireOpacity={0.4} pointSize={0.022} {...rest} />
      <Ring radius={ringRadius} position={[position[0], 0.01, position[2]]} opacity={0.22} />
      <Text position={[position[0] + captionOffset[0], captionOffset[1], position[2] + captionOffset[2]]} fontSize={0.13} letterSpacing={0.3} color="#6a6a6a">{label}</Text>
    </group>
  );
}

function LobbyScene() {
  const go = useApp((s) => s.go);
  const lib = useLibraryData();
  useRoomCamera([0, 1.7, 6], [0, 1.7, -10]);
  useHint('MOVE THE MOUSE TO LOOK · CLICK A DOOR');
  const songs = lib?.songs.length ?? 0;

  return (
    <group>
      {/* hall: walls and a row of columns down each side */}
      <WireBox size={[12, 6, 40]} position={[0, 3, -14]} />
      {COLUMN_Z.map((z, i) => (
        <group key={z}>
          <Model kind="column" position={[-5.4, 0, z]} points={600} pointSize={0.013} wireOpacity={0.14} seed={50 + i} />
          <Model kind="column" position={[5.4, 0, z]} points={600} pointSize={0.013} wireOpacity={0.14} seed={60 + i} />
        </group>
      ))}

      {/* the big screen at the end of the hall; the gallery door stands in front of it */}
      <EqualizerScreen position={[0, 2.4, -14.5]} size={[8, 3.6]} bars={40} />

      {/* title block */}
      <Text position={[0, 4.6, -10]} fontSize={0.9} letterSpacing={0.3} color="#ffffff">MUSIC GALLERY</Text>
      <Text position={[0, 3.8, -10]} fontSize={0.16} letterSpacing={0.25} color="#8a8a8a">A PERSONAL ROOM FOR EVERY SOUND</Text>
      <Text position={[0, 3.45, -10]} fontSize={0.1} letterSpacing={0.22} color="#5c5c5c">
        {songs > 0 ? `${songs.toLocaleString('en-US')} SONGS FROM YOUR LIBRARY · WALK THROUGH THEM` : 'YOUR MUSIC LIBRARY, AS A PLACE YOU CAN WALK THROUGH'}
      </Text>

      {/* instruments: wireframe plus point cloud */}
      <Exhibit label="PIANO" kind="piano" position={[4.1, 0, -6.5]} facing={-0.55} points={2600} ringRadius={1.5} captionOffset={[-0.7, 0.12, 1.5]} sway={0.06} seed={11} />
      <Exhibit label="GUITAR" kind="guitar" position={[-3.4, 0, -4]} facing={0.5} points={1800} captionOffset={[0.5, 0.12, 1.1]} sway={0.08} phase={1} seed={12} />
      <Exhibit label="VIOLIN" kind="violin" position={[3.3, 0, -3.2]} facing={-0.5} points={1200} ringRadius={0.8} captionOffset={[-0.4, 0.12, 1]} sway={0.1} phase={2} seed={13} />
      <Exhibit label="TURNTABLE" kind="turntable" position={[-3.9, 0, -6.8]} facing={0.6} points={1500} captionOffset={[0.8, 0.12, 1.2]} sway={0.05} phase={3} seed={14} />

      {/* things that float above the hall */}
      <Model kind="headphones" position={[1.9, 2.15, -5]} scale={1.6} points={500} spin={0.35} wireOpacity={0.6} pointSize={0.015} seed={21} />
      <Model kind="record" position={[-2.3, 3.1, -7.5]} rotation={[0.5, 0, 0.3]} spin={0.4} wireOpacity={0.35} />
      <Model kind="record" position={[2.7, 3.5, -9]} rotation={[0.4, 0, -0.25]} scale={0.8} spin={-0.3} wireOpacity={0.3} />

      {/* sound rings spreading from the gallery door */}
      <FloorPulse position={[0, 0.02, -12]} maxRadius={5.5} />

      <Door label="ENTER THE GALLERY" sublabel="HEAVEN" position={[0, 0, -12]} size={[2.4, 3]} cursorLabel="ENTER GALLERY" onOpen={() => go(PATHS.heaven)} />
      <Door label="STUDIO" sublabel="RECORDING ROOM" position={[-4.4, 0, -11]} rotation={[0, 0.45, 0]} cursorLabel="ENTER STUDIO" onOpen={() => go(PATHS.studio)} />
    </group>
  );
}

/** Plain links for keyboard and touch users: the 3D doors have no keyboard access yet. */
function LobbyPanels() {
  return (
    <nav aria-label="Lobby doors" style={{ position: 'absolute', left: 28, bottom: 56, display: 'flex', gap: 12, flexWrap: 'wrap', pointerEvents: 'none' }}>
      <Link className="btn" style={{ pointerEvents: 'auto', marginTop: 0 }} to={PATHS.heaven}>ENTER THE GALLERY</Link>
      <Link className="btn" style={{ pointerEvents: 'auto', marginTop: 0 }} to={PATHS.studio}>STUDIO</Link>
    </nav>
  );
}

export const lobbyRoom: RoomDef = { id: 'lobby', path: PATHS.lobby, title: 'Lobby', Scene: LobbyScene, Panels: LobbyPanels };
