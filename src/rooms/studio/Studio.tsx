// STUDIO. Owner: Person 2.
// Borrowed from the reference (docs/reference/06, 07, 08): a figure made of white points sitting on a stool with a name above it,
// a lit wall screen, a pinboard of frames, a hanging cone lamp, a door with a floating sign. Models and content are our own.
// Layout: a big round control room (walk in with scroll / W S A D). At the far end, behind a glass wall, is a separate vocal booth
// with its own walls, ceiling and foam. Walk through the glass door in the middle to go inside and stand next to the singers.
// You can turn all the way round: behind the start there is a lounge, record racks, drums and a cello, and a quiet line of text.
// No buttons: leave through the Lobby or Heaven gate (a tunnel of light plays, see ../lobby/models/transition.tsx).
import { useRef } from 'react';
import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { RoomDef } from '../../contract/types';
import { PATHS } from '../../contract/routes';
import { useApp, useHint } from '../../store/app';
import { WireBox, WireCylinder } from '../../world/Wire';
import { Door } from '../../world/Door';
import { Model } from '../lobby/models/Model';
import { EqualizerScreen, Ring } from '../lobby/models/effects';
import { useReducedMotion } from '../lobby/models/motion';
import { clamp, useWalk } from '../lobby/models/useWalk';
import { Tunnel, useGate } from '../lobby/models/transition';
import { SOMAY, VARUN, shoulderOf } from '../lobby/models/instruments';
import type { V3 } from '../lobby/models/build';

const START: V3 = [0, 1.7, 3];
const CENTER_Z = -7;      // centre of the round room
const GLASS_Z = -14;      // the glass wall of the booth
const GAP = 1.2;          // half-width of the glass door
const BOOTH_X = 4.1;      // how far sideways you can walk inside the booth
const BOOTH_BACK = -20;   // how far back you can walk inside the booth

/** Keeps the visitor inside the round room, and lets them into the booth only through the glass door. */
function constrainStudio(p: THREE.Vector3, prev: THREE.Vector3) {
  const dx = p.x; const dz = p.z - CENTER_Z; const r = Math.hypot(dx, dz);
  if (r > 14.2) { p.x = (dx * 14.2) / r; p.z = (dz * 14.2) / r + CENTER_Z; }
  const inGap = Math.abs(p.x) < GAP - 0.2;
  const wasInside = prev.z < GLASS_Z - 0.25;
  if (p.z < GLASS_Z + 0.5) {
    if (wasInside) {
      p.x = clamp(p.x, -BOOTH_X, BOOTH_X);
      p.z = Math.max(p.z, BOOTH_BACK);
      if (p.z > GLASS_Z - 0.3 && !inGap) p.z = GLASS_Z - 0.3; // can only leave through the door
    } else if (!inGap) {
      p.z = GLASS_Z + 0.5;                                    // glass wall: stop in front of it
    }
  }
}

const ARM = { somay: ['somayL', 'somayR'], varun: ['varunL', 'varunR'] } as const;
const SHOULDERS = {
  somay: { left: shoulderOf(SOMAY, 'left'), right: shoulderOf(SOMAY, 'right') },
  varun: { left: shoulderOf(VARUN, 'left'), right: shoulderOf(VARUN, 'right') },
};

/** A point-cloud singer that sways, breathes and moves their arms (still with reduced motion). */
function Singer({ who, position, phase, armL, armR, seed }: { who: 'somay' | 'varun'; position: V3; phase: number; armL: number; armR: number; seed: number }) {
  const reduced = useReducedMotion();
  const root = useRef<THREE.Group>(null);
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (reduced) return;
    const t = state.clock.elapsedTime + phase;
    const g = root.current;
    if (g) {
      g.rotation.y = Math.sin(t * 0.45) * 0.28;
      g.rotation.z = Math.sin(t * 0.8) * 0.02;
      g.position.y = position[1] + Math.sin(t * 1.6) * 0.012;
    }
    if (left.current) { left.current.rotation.z = Math.sin(t * 1.3) * armL; left.current.rotation.x = Math.sin(t * 0.9 + 1) * armL * 0.4; }
    if (right.current) { right.current.rotation.z = -Math.sin(t * 1.1 + 2) * armR; right.current.rotation.x = Math.sin(t * 1.4) * armR * 0.5; }
  });
  const [kl, kr] = ARM[who];
  const common = { pointSize: 0.02, pointColor: '#d6e2ff', wireOpacity: 0.1 } as const;
  return (
    <group ref={root} position={position} scale={1.25}>
      <Model kind={who} points={2300} seed={seed} {...common} fog={false} />
      <group ref={left} position={SHOULDERS[who].left}><Model kind={kl} points={380} seed={seed + 1} {...common} fog={false} /></group>
      <group ref={right} position={SHOULDERS[who].right}><Model kind={kr} points={380} seed={seed + 2} {...common} fog={false} /></group>
    </group>
  );
}

function StudioScene() {
  const go = useApp((s) => s.go);
  const enter = useGate(go);
  const reduced = useReducedMotion();
  const lamp = useRef<THREE.MeshBasicMaterial>(null);
  useWalk({ start: START, constrain: constrainStudio });
  useHint('SCROLL OR W / S TO WALK · DRAG OR ← → TO LOOK AROUND · GLASS DOOR TO THE BOOTH');

  useFrame((state) => {
    if (lamp.current) lamp.current.opacity = reduced ? 0.85 : 0.55 + 0.35 * Math.sin(state.clock.elapsedTime * 1.6);
  });

  const SZ = GLASS_Z - 3.8;   // where the singers stand
  return (
    <group>
      <fog attach="fog" args={['#000000', 14, 95]} />
      <Tunnel />

      {/* the big round control room: wall, dome, acoustic panels, ring lights */}
      <WireCylinder radius={15} height={6} segments={48} position={[0, 3, CENTER_Z]} opacity={0.3} />
      <Model kind="dome" position={[0, 6, CENTER_Z]} scale={[1.667, 0.9, 1.667]} edgeAngle={1} wireOpacity={0.2} fog={false} />
      <Model kind="panels" position={[0, 0, CENTER_Z]} wireOpacity={0.3} />
      <Model kind="lights" wireOpacity={0.5} />

      {/* THE VOCAL BOOTH: a separate room with its own dotted walls, ceiling, floor and foam */}
      <group position={[0, 0, GLASS_Z]}>
        <Model kind="boothShell" points={5200} pointSize={0.022} pointColor="#bcc8e8" wireOpacity={0.5} fog={false} seed={80} />
        <Model kind="foam" position={[0, 0, -6.36]} wireOpacity={0.45} fog={false} />
        <Model kind="foam" position={[-4.4, 0, -3.25]} rotation={[0, Math.PI / 2, 0]} scale={[0.65, 1, 1]} wireOpacity={0.35} fog={false} />
        <Model kind="foam" position={[4.4, 0, -3.25]} rotation={[0, -Math.PI / 2, 0]} scale={[0.65, 1, 1]} wireOpacity={0.35} fog={false} />
        <Model kind="coneLamp" position={[-2.2, 3.7, -3.8]} wireOpacity={0.7} fog={false} />
        <Model kind="coneLamp" position={[2.2, 3.7, -3.8]} wireOpacity={0.7} fog={false} />
      </group>

      {/* glass wall with a door in the middle, a frame, and signs */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * 2.85, 2.05, GLASS_Z]} raycast={() => undefined}>
            <planeGeometry args={[3.3, 3.3]} />
            <meshBasicMaterial color="#9fb4ff" transparent opacity={0.1} depthWrite={false} fog={false} />
          </mesh>
          <WireBox size={[3.3, 3.3, 0.04]} position={[s * 2.85, 2.05, GLASS_Z]} opacity={0.9} />
          <WireBox size={[0.1, 3.5, 0.1]} position={[s * GAP, 1.9, GLASS_Z]} opacity={0.9} />
        </group>
      ))}
      <WireBox size={[2.5, 0.12, 0.12]} position={[0, 3.7, GLASS_Z]} opacity={0.9} />
      <Text position={[0, 5.0, GLASS_Z + 0.1]} fontSize={0.4} letterSpacing={0.3} color="#ffffff">RECORDING ROOM</Text>
      <mesh position={[0, 4.15, GLASS_Z + 0.05]}>
        <boxGeometry args={[1.1, 0.28, 0.06]} />
        <meshBasicMaterial ref={lamp} color="#ff5a4a" transparent opacity={0.85} fog={false} />
      </mesh>
      <Text position={[0, 4.15, GLASS_Z + 0.1]} fontSize={0.16} letterSpacing={0.2} color="#000000">ON AIR</Text>

      {/* the singers, inside the booth */}
      <Ring radius={1.6} position={[-2.2, 0.01, SZ]} opacity={0.3} />
      <Ring radius={1.6} position={[2.2, 0.01, SZ]} opacity={0.3} />
      <Model kind="stool" position={[-2.2, 0, SZ]} scale={1.25} wireOpacity={0.6} fog={false} />
      <Singer who="somay" position={[-2.2, 0, SZ]} phase={0} armL={0.06} armR={0.14} seed={31} />
      <Singer who="varun" position={[2.2, 0, SZ]} phase={2} armL={0.45} armR={0.06} seed={41} />
      <Model kind="micStandLow" position={[-2.2, 0, SZ + 0.85]} wireOpacity={0.7} fog={false} />
      <Model kind="micStand" position={[2.2, 0, SZ + 0.85]} scale={1.2} wireOpacity={0.7} fog={false} />
      <Text position={[-2.2, 2.6, SZ]} fontSize={0.2} letterSpacing={0.3} color="#9a9a9a">SOMAY</Text>
      <Text position={[2.2, 3.15, SZ]} fontSize={0.2} letterSpacing={0.3} color="#9a9a9a">VARUN</Text>

      {/* control room: the big mixing desk and two monitors facing the operator */}
      <Model kind="consoleDesk" position={[0, 0, -9.2]} scale={1.35} wireOpacity={0.6} />
      <Model kind="speaker" position={[-6.2, 0, -10.6]} rotation={[0, 0.35, 0]} scale={1.7} wireOpacity={0.6} />
      <Model kind="speaker" position={[6.2, 0, -10.6]} rotation={[0, -0.35, 0]} scale={1.7} wireOpacity={0.6} />

      {/* walls: pinboard on the left, equalizer screen on the right */}
      <Model kind="board" position={[-14.6, 2.8, CENTER_Z]} rotation={[0, Math.PI / 2, 0]} scale={1.8} wireOpacity={0.45} />
      <EqualizerScreen position={[14.6, 3.3, CENTER_Z]} rotation={[0, -Math.PI / 2, 0]} size={[7, 3.6]} bars={32} />

      {/* left corner: tabla, harmonium and tanpura on a rug */}
      <Ring radius={2.4} position={[-8, 0.01, -3]} opacity={0.3} />
      <Ring radius={3.2} position={[-8, 0.01, -3]} opacity={0.2} />
      <Ring radius={4} position={[-8, 0.01, -3]} opacity={0.12} />
      <Model kind="harmonium" position={[-8.6, 0.05, -2.2]} rotation={[0, 0.7, 0]} scale={2.2} points={1100} bob={0.05} wireOpacity={0.55} pointSize={0.03} seed={41} />
      <Model kind="tabla" position={[-6.6, 0.05, -3.4]} rotation={[0, 0.5, 0]} scale={2.2} points={1100} bob={0.05} phase={1} wireOpacity={0.55} pointSize={0.03} seed={42} />
      <Model kind="tanpura" position={[-10.2, 0.05, -4.6]} rotation={[0, 0.6, 0]} scale={1.5} points={1400} sway={0.12} bob={0.05} phase={2} wireOpacity={0.5} pointSize={0.03} seed={43} />

      {/* right corner: keyboard and guitar */}
      <Model kind="synth" position={[8, 0.05, -3]} rotation={[0, -0.5, 0]} scale={1.9} points={1000} bob={0.05} wireOpacity={0.55} pointSize={0.03} seed={44} />
      <Model kind="guitar" position={[10.2, 0.05, -5]} rotation={[0, -0.6, 0]} scale={2} points={1600} sway={0.15} bob={0.06} phase={3} wireOpacity={0.5} pointSize={0.03} seed={45} />

      {/* behind you: a lounge, record racks, drums, a cello, a sax in the air, and a quiet line of text */}
      <Text position={[0, 4.6, 7.7]} rotation={[0, Math.PI, 0]} fontSize={2.2} letterSpacing={0.4} color="#2e2e2e">STUDIO</Text>
      <Text position={[0, 3.4, 7.7]} rotation={[0, Math.PI, 0]} fontSize={0.26} letterSpacing={0.5} color="#3a3a3a">SOMAY · VARUN</Text>
      <Model kind="sofa" position={[0, 0, 6.4]} scale={2} wireOpacity={0.5} />
      <Model kind="coffeeTable" position={[0, 0, 4.7]} scale={2} wireOpacity={0.5} />
      {[-1, 1].map((s) => {
        const a = s * 0.62;                                   // angle round the back wall
        const x = 13.6 * Math.sin(a); const z = CENTER_Z + 13.6 * Math.cos(a);
        return <Model key={s} kind="vinylRack" position={[x, 0, z]} rotation={[0, Math.atan2(-x, CENTER_Z - z), 0]} scale={1.6} wireOpacity={0.5} />;
      })}
      <Model kind="drumKit" position={[9.5, 0.05, 3]} rotation={[0, Math.atan2(-9.5, CENTER_Z - 3), 0]} scale={2} points={1800} sway={0.08} bob={0.05} wireOpacity={0.5} pointSize={0.03} seed={51} />
      <Model kind="cello" position={[-9.5, 0.05, 3]} rotation={[0, Math.atan2(9.5, CENTER_Z - 3), 0]} scale={1.9} points={1500} sway={0.15} bob={0.06} phase={1} wireOpacity={0.5} pointSize={0.03} seed={52} />
      <Model kind="saxophone" position={[-4.5, 0.8, 2]} rotation={[0, 0.7, 0]} scale={2.1} points={1200} sway={0.25} bob={0.15} phase={2} wireOpacity={0.5} pointSize={0.03} seed={53} />
      <Model kind="ampStack" position={[5.5, 0, 5.2]} rotation={[0, Math.PI + 0.4, 0]} scale={1.8} wireOpacity={0.55} />
      <Model kind="ampStack" position={[-5.5, 0, 5.2]} rotation={[0, Math.PI - 0.4, 0]} scale={1.8} wireOpacity={0.55} />
      <Model kind="musicStand" position={[-3.5, 0, -3]} rotation={[0, 0.4, 0]} scale={1.8} wireOpacity={0.5} />
      <Model kind="bench" position={[7, 0, -12]} rotation={[0, -0.9, 0]} scale={2} wireOpacity={0.5} />
      <Model kind="bench" position={[-7, 0, -12]} rotation={[0, 0.9, 0]} scale={2} wireOpacity={0.5} />

      <Door label="LOBBY" sublabel="BACK TO THE HALL" position={[-12.8, 0, -1]} rotation={[0, 1.2, 0]} size={[3, 4.4]} onOpen={() => enter(PATHS.lobby, [-13.5, 1.7, -1.3])} />
      <Door label="HEAVEN" sublabel="THE GALLERY" position={[12.8, 0, -1]} rotation={[0, -1.2, 0]} size={[3, 4.4]} onOpen={() => enter(PATHS.heaven, [13.5, 1.7, -1.3])} />
    </group>
  );
}

// No Panels on purpose: there are no buttons, you walk through the gates.
export const studioRoom: RoomDef = { id: 'studio', path: PATHS.studio, title: 'Studio', Scene: StudioScene };
