// LOBBY. Owner: Person 2.
// Borrowed from the reference (docs/reference/05-lobby and the screen recordings): the long hall with dotted columns, a roof of
// trusses, tall windows, a big lit screen at the far end with the gate in front of it, the Studio gate up a short flight of stairs
// on the side, floating door signs, and a tunnel of light when you go through a gate. Instruments, text and models are our own.
// You WALK and LOOK AROUND (scroll / W S A D / drag), there are no buttons: you leave through the gates. See models/useWalk.ts.
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
import { Tunnel, useGate } from './models/transition';
import type { V3 } from './models/build';

const COLUMN_Z = [6, -2, -10, -18, -26, -38];
const START: V3 = [0, 1.7, 10];
const STAIRS_Z = -32;               // the Studio stairs, up the left wall
const STAIRS_X = -4.8;              // where the first step starts
const MAIN_GATE_Z = -38;

function constrainLobby(p: THREE.Vector3, prev: THREE.Vector3) {
  const onStairsRow = Math.abs(prev.z - STAIRS_Z) < 1.4;   // only enter the stairs from the aisle at their row
  if (p.x < -3.2 && (onStairsRow || prev.x < -3.2)) {
    p.z = clamp(p.z, STAIRS_Z - 1.4, STAIRS_Z + 1.4);
    p.x = Math.max(p.x, -9.0);
    return;
  }
  p.x = clamp(p.x, -3.2, 3.2);
  p.z = clamp(p.z, -35, 10.5);
}

/** Height of the floor: four steps up, then the platform in front of the Studio gate. */
function lobbyGround(x: number, z: number) {
  if (x < STAIRS_X && Math.abs(z - STAIRS_Z) < 1.8) return Math.min(1.2, 0.3 * (Math.floor((STAIRS_X - x) / 0.48) + 1));
  return 0;
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
  const enter = useGate(go);
  useWalk({ start: START, constrain: constrainLobby, ground: lobbyGround });
  useHint('SCROLL OR W / S TO WALK · DRAG OR ← → TO LOOK AROUND · WALK INTO A GATE');
  const songs = lib?.songs.length ?? 0;

  return (
    <group>
      <fog attach="fog" args={['#000000', 14, 95]} />
      <Tunnel />

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

      {/* the big screen at the end of the hall, with the main gate standing in front of it */}
      <EqualizerScreen position={[0, 4.4, -44]} size={[16, 7.5]} bars={56} />
      <FloorPulse position={[0, 0.02, MAIN_GATE_Z]} maxRadius={9} />

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

      {/* more of the hall: drums, cello, a sax in the air, benches, record racks, amps, music stands, lamps */}
      <Model kind="drumKit" position={[5.2, 0.05, -18]} rotation={[0, -0.9, 0]} scale={2} points={1800} sway={0.08} bob={0.05} wireOpacity={0.5} pointSize={0.03} seed={81} />
      <Model kind="cello" position={[-5, 0.05, -18]} rotation={[0, 0.6, 0]} scale={1.9} points={1500} sway={0.15} bob={0.06} phase={1} wireOpacity={0.5} pointSize={0.03} seed={82} />
      <Model kind="saxophone" position={[4.6, 0.8, -25]} rotation={[0, -0.7, 0]} scale={2.1} points={1200} sway={0.25} bob={0.15} phase={2} wireOpacity={0.5} pointSize={0.03} seed={83} />
      <Model kind="bench" position={[-4.4, 0, -14]} rotation={[0, 0.4, 0]} scale={2} wireOpacity={0.5} />
      <Model kind="bench" position={[4.4, 0, -14]} rotation={[0, -0.4, 0]} scale={2} wireOpacity={0.5} />
      <Model kind="vinylRack" position={[-9.5, 0, -10]} rotation={[0, Math.PI / 2, 0]} scale={1.6} wireOpacity={0.5} />
      <Model kind="vinylRack" position={[9.5, 0, -10]} rotation={[0, -Math.PI / 2, 0]} scale={1.6} wireOpacity={0.5} />
      <Model kind="vinylRack" position={[-9.5, 0, -18]} rotation={[0, Math.PI / 2, 0]} scale={1.6} wireOpacity={0.5} />
      <Model kind="vinylRack" position={[9.5, 0, -18]} rotation={[0, -Math.PI / 2, 0]} scale={1.6} wireOpacity={0.5} />
      <Model kind="ampStack" position={[-5, 0, -36]} rotation={[0, 0.5, 0]} scale={1.8} wireOpacity={0.55} />
      <Model kind="ampStack" position={[5, 0, -36]} rotation={[0, -0.5, 0]} scale={1.8} wireOpacity={0.55} />
      <Model kind="musicStand" position={[3.6, 0, -4.5]} rotation={[0, -0.5, 0]} scale={1.8} wireOpacity={0.5} />
      <Model kind="musicStand" position={[-3.6, 0, -4.5]} rotation={[0, 0.5, 0]} scale={1.8} wireOpacity={0.5} />
      {[-4, -16, -28].map((z) => <Model key={z} kind="coneLamp" position={[0, 6.7, z]} scale={3} wireOpacity={0.5} fog={false} />)}

      {/* things that hang in the air and keep moving */}
      <Model kind="headphones" position={[0, 5.2, -14]} scale={3.2} points={900} spin={0.4} bob={0.25} wireOpacity={0.7} pointSize={0.03} seed={21} />
      <Model kind="record" position={[-3.5, 6.4, -22]} rotation={[0.5, 0, 0.3]} scale={2.4} spin={0.5} bob={0.2} phase={1} wireOpacity={0.4} />
      <Model kind="record" position={[4.2, 6.8, -28]} rotation={[0.4, 0, -0.25]} scale={2} spin={-0.4} bob={0.2} phase={2} wireOpacity={0.4} />
      <Model kind="record" position={[-4, 5.6, -32]} rotation={[0.3, 0, 0.2]} scale={1.8} spin={0.35} bob={0.15} phase={4} wireOpacity={0.35} />

      {/* behind you: the grand entrance, a quiet line of text, a sofa, record racks and amps */}
      <Model kind="arch" position={[0, 0, 13.6]} points={1400} pointSize={0.03} wireOpacity={0.3} seed={90} />
      <Text position={[0, 7.4, 13.5]} rotation={[0, Math.PI, 0]} fontSize={1.5} letterSpacing={0.35} color="#2e2e2e">MUSIC GALLERY</Text>
      <Text position={[0, 6.3, 13.5]} rotation={[0, Math.PI, 0]} fontSize={0.26} letterSpacing={0.5} color="#3a3a3a">YOUR LIBRARY · YOUR ROOMS</Text>
      <Text position={[0, 5.8, 13.5]} rotation={[0, Math.PI, 0]} fontSize={0.15} letterSpacing={0.6} color="#333333">EST. 2026</Text>
      <Model kind="sofa" position={[0, 0, 12.6]} scale={2} wireOpacity={0.5} />
      <Model kind="vinylRack" position={[-6.4, 0, 13.6]} rotation={[0, Math.PI, 0]} scale={1.6} wireOpacity={0.5} />
      <Model kind="vinylRack" position={[6.4, 0, 13.6]} rotation={[0, Math.PI, 0]} scale={1.6} wireOpacity={0.5} />
      <Model kind="ampStack" position={[-3.8, 0, 13.2]} rotation={[0, Math.PI, 0]} scale={1.8} wireOpacity={0.55} />
      <Model kind="ampStack" position={[3.8, 0, 13.2]} rotation={[0, Math.PI, 0]} scale={1.8} wireOpacity={0.55} />
      <Model kind="bench" position={[-4.4, 0, 9]} rotation={[0, Math.PI - 0.3, 0]} scale={2} wireOpacity={0.5} />
      <Model kind="bench" position={[4.4, 0, 9]} rotation={[0, Math.PI + 0.3, 0]} scale={2} wireOpacity={0.5} />

      {/* the Studio gate: up a short flight of stairs on the left wall, close to the main gate */}
      <Model kind="stairs" position={[STAIRS_X, 0, STAIRS_Z]} points={1600} pointSize={0.03} wireOpacity={0.55} seed={95} />
      <Door label="STUDIO" sublabel="RECORDING ROOM" position={[-9.7, 1.2, STAIRS_Z]} rotation={[0, Math.PI / 2, 0]} size={[3.2, 5]} cursorLabel="ENTER STUDIO"
        onOpen={() => enter(PATHS.studio, [-10.3, 2.9, STAIRS_Z])} />

      {/* the main gate */}
      <Door label="ENTER THE GALLERY" sublabel="HEAVEN" position={[0, 0, MAIN_GATE_Z]} size={[3.8, 5.4]} cursorLabel="ENTER GALLERY"
        onOpen={() => enter(PATHS.heaven, [0, 1.7, MAIN_GATE_Z - 1.5])} />
    </group>
  );
}

// No Panels on purpose: there are no buttons, you walk through the gates.
export const lobbyRoom: RoomDef = { id: 'lobby', path: PATHS.lobby, title: 'Lobby', Scene: LobbyScene };
