// LOBBY. Owner: Person 2.
// Borrowed from the reference (docs/reference/05-lobby): the long hall with dotted columns, a roof of trusses, tall windows,
// a big lit screen at the far end with the door in front of it, and floating door signs. Instruments, text and models are our own.
// You WALK in this room (scroll / W S A D); pinch-zoom is blocked, see models/useWalk.ts.
import { Link } from 'react-router-dom';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import type { RoomDef } from '../../contract/types';
import { PATHS } from '../../contract/routes';
import { useApp, useHint } from '../../store/app';
import { useLibraryData } from '../../data/library';
import { WireBox } from '../../world/Wire';
import { Door } from '../../world/Door';
import { Model } from './models/Model';
import { EqualizerScreen, FloorGrid, FloorPulse, Ring } from './models/effects';
import { clamp, useWalk } from './models/useWalk';
import type { V3 } from './models/build';

const COLUMN_Z = [6, -2, -10, -18, -26, -34];
const START: V3 = [0, 1.7, 12];

function constrainLobby(p: THREE.Vector3) {
  p.x = clamp(p.x, -3.2, 3.2);
  p.z = clamp(p.z, -34, 12);
}

/** An exhibit: a big floating instrument, a ring on the floor under it, and a caption. */
function Exhibit({ label, kind, position, facing, scale, points, ringRadius, captionZ, ...rest }: {
  label: string; kind: 'piano' | 'guitar' | 'violin' | 'turntable'; position: V3; facing: number; scale: number;
  points: number; ringRadius: number; captionZ: number; sway?: number; phase?: number; seed?: number; bob?: number;
}) {
  return (
    <group>
      <Model kind={kind} position={position} rotation={[0, facing, 0]} scale={scale} points={points} wireOpacity={0.5} pointSize={0.03} {...rest} />
      <Ring radius={ringRadius} position={[position[0], 0.01, position[2]]} opacity={0.3} />
      <Text position={[position[0], 0.25, position[2] + captionZ]} fontSize={0.34} letterSpacing={0.3} color="#7a7a7a">{label}</Text>
    </group>
  );
}

function LobbyScene() {
  const go = useApp((s) => s.go);
  const lib = useLibraryData();
  useWalk({ start: START, constrain: constrainLobby });
  useHint('SCROLL OR W / S TO WALK · MOVE THE MOUSE TO LOOK · CLICK A DOOR');
  const songs = lib?.songs.length ?? 0;

  return (
    <group>
      <fog attach="fog" args={['#000000', 14, 95]} />

      {/* the hall: walls, roof trusses, tall windows, a column on each side every 8 m, floor markings */}
      <WireBox size={[20, 8.4, 64]} position={[0, 4.2, -18]} opacity={0.3} />
      <Model kind="roof" wireOpacity={0.3} fog={false} />
      <Model kind="windowRow" position={[-9.95, 0, 0]} points={500} pointSize={0.025} wireOpacity={0.3} seed={70} />
      <Model kind="windowRow" position={[9.95, 0, 0]} points={500} pointSize={0.025} wireOpacity={0.3} seed={71} />
      {COLUMN_Z.map((z, i) => (
        <group key={z}>
          <Model kind="column" position={[-7.4, 0, z]} scale={1.4} points={500} pointSize={0.03} wireOpacity={0.16} seed={50 + i} />
          <Model kind="column" position={[7.4, 0, z]} scale={1.4} points={500} pointSize={0.03} wireOpacity={0.16} seed={60 + i} />
        </group>
      ))}
      <FloorGrid width={6.8} depth={52} cols={4} rows={13} position={[0, 0.012, -14]} />

      {/* the big screen at the end of the hall, with the gallery door standing in front of it */}
      <EqualizerScreen position={[0, 4.4, -44]} size={[16, 7.5]} bars={56} />
      <FloorPulse position={[0, 0.02, -40]} maxRadius={9} />

      {/* title block */}
      <Text position={[0, 6.7, -2]} fontSize={1.5} letterSpacing={0.3} color="#ffffff">MUSIC GALLERY</Text>
      <Text position={[0, 5.45, -2]} fontSize={0.34} letterSpacing={0.25} color="#8a8a8a">A PERSONAL ROOM FOR EVERY SOUND</Text>
      <Text position={[0, 4.85, -2]} fontSize={0.2} letterSpacing={0.22} color="#5c5c5c">
        {songs > 0 ? `${songs.toLocaleString('en-US')} SONGS FROM YOUR LIBRARY · WALK THROUGH THEM` : 'YOUR MUSIC LIBRARY, AS A PLACE YOU CAN WALK THROUGH'}
      </Text>

      {/* big exhibits that float a little above their floor rings */}
      <Exhibit label="GUITAR" kind="guitar" position={[-4.4, 0.15, 2]} facing={0.6} scale={2.2} points={2400} ringRadius={2.2} captionZ={2.8} sway={0.18} bob={0.1} phase={1} seed={12} />
      <Exhibit label="VIOLIN" kind="violin" position={[4.4, 0.15, 2]} facing={-0.6} scale={2.2} points={1800} ringRadius={1.8} captionZ={2.6} sway={0.22} bob={0.1} phase={2} seed={13} />
      <Exhibit label="PIANO" kind="piano" position={[4.8, 0.1, -9]} facing={-0.8} scale={2.2} points={3600} ringRadius={3.6} captionZ={4.2} sway={0.1} bob={0.06} seed={11} />
      <Exhibit label="TURNTABLE" kind="turntable" position={[-4.8, 0.1, -9]} facing={0.8} scale={2.2} points={2400} ringRadius={2.4} captionZ={3} sway={0.12} bob={0.06} phase={3} seed={14} />

      {/* things that hang in the air and keep moving */}
      <Model kind="headphones" position={[0, 5.2, -14]} scale={3.2} points={900} spin={0.4} bob={0.25} wireOpacity={0.7} pointSize={0.03} seed={21} />
      <Model kind="record" position={[-3.5, 6.4, -22]} rotation={[0.5, 0, 0.3]} scale={2.4} spin={0.5} bob={0.2} phase={1} wireOpacity={0.4} />
      <Model kind="record" position={[4.2, 6.8, -28]} rotation={[0.4, 0, -0.25]} scale={2} spin={-0.4} bob={0.2} phase={2} wireOpacity={0.4} />
      <Model kind="record" position={[-4, 5.6, -32]} rotation={[0.3, 0, 0.2]} scale={1.8} spin={0.35} bob={0.15} phase={4} wireOpacity={0.35} />

      <Door label="ENTER THE GALLERY" sublabel="HEAVEN" position={[0, 0, -40]} size={[3.8, 5.4]} cursorLabel="ENTER GALLERY" onOpen={() => go(PATHS.heaven)} />
      <Door label="STUDIO" sublabel="RECORDING ROOM" position={[-9.7, 0, -14]} rotation={[0, Math.PI / 2, 0]} size={[3.2, 5]} cursorLabel="ENTER STUDIO" onOpen={() => go(PATHS.studio)} />
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
