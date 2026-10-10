// STUDIO. Owner: Person 2.
// Borrowed from the reference (docs/reference/06, 07, 08): a figure made of white points sitting on a stool with a name above it,
// a lit wall screen, a pinboard of frames, a hanging cone lamp, a door with a floating sign. Models and content are our own.
// A recording studio under a dome. A control room (mixing desk, monitors, Indian and Western instruments) looks through
// glass into a vocal booth where two point-cloud singers, Somay and Varun, stand at microphones.
// Doors: Lobby (left) and Heaven (right). All models are built in code (see ../lobby/models/).
import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type * as THREE from 'three';
import type { RoomDef } from '../../contract/types';
import { PATHS } from '../../contract/routes';
import { useApp, useHint } from '../../store/app';
import { useRoomCamera } from '../../world/useRoomCamera';
import { WireBox, WireCylinder } from '../../world/Wire';
import { Door } from '../../world/Door';
import { Model } from '../lobby/models/Model';
import { EqualizerScreen, Ring } from '../lobby/models/effects';
import { useReducedMotion } from '../lobby/models/motion';

const GLASS_Z = -8;
const SINGER_Z = -9.8;
const MIC_Z = -9.15;

function StudioScene() {
  const go = useApp((s) => s.go);
  const reduced = useReducedMotion();
  const lamp = useRef<THREE.MeshBasicMaterial>(null);
  useRoomCamera([0, 1.7, 5], [0, 1.7, -8]);
  useHint('MOVE THE MOUSE TO LOOK · CLICK A DOOR');

  // the ON AIR lamp breathes slowly; steady with reduced motion
  useFrame((state) => {
    if (lamp.current) lamp.current.opacity = reduced ? 0.85 : 0.55 + 0.35 * Math.sin(state.clock.elapsedTime * 1.6);
  });

  return (
    <group>
      {/* the room: round wall, dome above it, acoustic panels, ring lights */}
      <WireCylinder radius={9} height={4.5} segments={36} position={[0, 2.25, -3]} opacity={0.3} />
      <Model kind="dome" position={[0, 4.5, -3]} scale={[1, 0.55, 1]} edgeAngle={1} wireOpacity={0.2} />
      <Model kind="panels" position={[0, 0, -3]} wireOpacity={0.3} />
      <Model kind="lights" wireOpacity={0.5} />

      {/* the vocal booth behind two panes of glass */}
      <WireBox size={[6.4, 3.6, 3.8]} position={[0, 1.8, -9.9]} opacity={0.3} />
      {[-1.5, 1.5].map((x) => (
        <group key={x}>
          <mesh position={[x, 1.8, GLASS_Z]} raycast={() => undefined}>
            <planeGeometry args={[2.9, 2.6]} />
            <meshBasicMaterial color="#9fb4ff" transparent opacity={0.07} depthWrite={false} />
          </mesh>
          <WireBox size={[2.9, 2.6, 0.02]} position={[x, 1.8, GLASS_Z]} opacity={0.6} />
        </group>
      ))}
      <mesh position={[0, 3.4, GLASS_Z + 0.03]}>
        <boxGeometry args={[0.6, 0.16, 0.04]} />
        <meshBasicMaterial ref={lamp} color="#ff5a4a" transparent opacity={0.85} />
      </mesh>
      <Text position={[0, 3.4, GLASS_Z + 0.06]} fontSize={0.09} letterSpacing={0.2} color="#000000">ON AIR</Text>

      {/* singers: point clouds with a faint outline, swaying slightly */}
      <Ring radius={1.1} position={[-1.4, 0.01, SINGER_Z]} opacity={0.25} />
      <Ring radius={1.1} position={[1.4, 0.01, SINGER_Z]} opacity={0.25} />
      <Model kind="stool" position={[-1.4, 0, SINGER_Z]} wireOpacity={0.5} />
      <Model kind="somay" position={[-1.4, 0, SINGER_Z]} points={2600} pointSize={0.02} pointColor="#d6e2ff" wireOpacity={0.1} sway={0.12} seed={31} />
      <Model kind="varun" position={[1.4, 0, SINGER_Z]} points={2800} pointSize={0.02} pointColor="#d6e2ff" wireOpacity={0.1} sway={0.12} phase={2} seed={32} />
      <Model kind="micStandLow" position={[-1.4, 0, MIC_Z]} wireOpacity={0.6} />
      <Model kind="micStand" position={[1.4, 0, MIC_Z]} wireOpacity={0.6} />
      <Text position={[-1.4, 2.3, GLASS_Z + 0.05]} fontSize={0.12} letterSpacing={0.3} color="#8a8a8a">SOMAY</Text>
      <Text position={[1.4, 2.5, GLASS_Z + 0.05]} fontSize={0.12} letterSpacing={0.3} color="#8a8a8a">VARUN</Text>

      {/* walls: pinboard on the left, equalizer screen on the right */}
      <Model kind="board" position={[-8.4, 1.9, -3]} rotation={[0, Math.PI / 2, 0]} wireOpacity={0.4} />
      <EqualizerScreen position={[8.4, 2.1, -3]} rotation={[0, -Math.PI / 2, 0]} size={[3.4, 1.8]} bars={24} />

      {/* control room: mixing desk and two monitors facing the operator */}
      <Model kind="consoleDesk" position={[0, 0, -6.4]} wireOpacity={0.55} />
      <Model kind="speaker" position={[-2.3, 0, -6.5]} rotation={[0, 0.3, 0]} wireOpacity={0.55} />
      <Model kind="speaker" position={[2.3, 0, -6.5]} rotation={[0, -0.3, 0]} wireOpacity={0.55} />

      {/* left corner: tabla, harmonium and tanpura on a rug */}
      <Ring radius={1.2} position={[-3.6, 0.01, -3.4]} opacity={0.25} />
      <Ring radius={1.6} position={[-3.6, 0.01, -3.4]} opacity={0.18} />
      <Ring radius={2.0} position={[-3.6, 0.01, -3.4]} opacity={0.12} />
      <Model kind="harmonium" position={[-3.9, 0, -3]} rotation={[0, 0.7, 0]} points={700} wireOpacity={0.5} seed={41} />
      <Model kind="tabla" position={[-2.9, 0, -3.5]} rotation={[0, 0.5, 0]} points={700} wireOpacity={0.5} seed={42} />
      <Model kind="tanpura" position={[-4.7, 0, -4.2]} rotation={[0, 0.6, 0]} points={900} wireOpacity={0.45} seed={43} />

      {/* right corner: keyboard and guitar */}
      <Model kind="synth" position={[3.6, 0, -3.4]} rotation={[0, -0.5, 0]} points={600} wireOpacity={0.5} seed={44} />
      <Model kind="guitar" position={[4.6, 0, -4.3]} rotation={[0, -0.6, 0]} points={1000} wireOpacity={0.4} seed={45} />

      <Door label="LOBBY" sublabel="BACK TO THE HALL" position={[-5.5, 0, -6]} rotation={[0, 0.9, 0]} onOpen={() => go(PATHS.lobby)} />
      <Door label="HEAVEN" sublabel="THE GALLERY" position={[5.5, 0, -6]} rotation={[0, -0.9, 0]} onOpen={() => go(PATHS.heaven)} />
    </group>
  );
}

/** Plain links for keyboard and touch users: the 3D doors have no keyboard access yet. */
function StudioPanels() {
  return (
    <nav aria-label="Studio doors" style={{ position: 'absolute', left: 28, bottom: 56, display: 'flex', gap: 12, flexWrap: 'wrap', pointerEvents: 'none' }}>
      <Link className="btn" style={{ pointerEvents: 'auto', marginTop: 0 }} to={PATHS.lobby}>LOBBY</Link>
      <Link className="btn" style={{ pointerEvents: 'auto', marginTop: 0 }} to={PATHS.heaven}>HEAVEN</Link>
    </nav>
  );
}

export const studioRoom: RoomDef = { id: 'studio', path: PATHS.studio, title: 'Studio', Scene: StudioScene, Panels: StudioPanels };
