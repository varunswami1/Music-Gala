// Door-to-door transition for Lobby and Studio. Owner: Person 2.
// Borrowed idea (reference recording): you fly into the door, the view stretches into a tunnel and fades to black with streaks of
// light flashing past, then the next room opens out of the dark. Effects are skipped with prefers-reduced-motion.
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { rng, type V3 } from './build';
import { useReducedMotion } from './motion';

/** Shared transition state (module level, so it survives the Scene being swapped for the next room). */
export const gate = {
  phase: 'idle' as 'idle' | 'leaving' | 'arriving',
  t: 0,
  from: new THREE.Vector3(),
  fromSet: false,
  to: new THREE.Vector3(),
  path: '',
  go: null as null | ((path: string) => void),
  arriveUntil: 0,
};

const LEAVE = 1.4;   // seconds flying into the door
const ARRIVE = 1.8;  // seconds opening out of the dark
const N = 180;

/** Returns `enter(path, to)`: fly the camera to `to` (just past the door), then navigate to `path`. */
export function useGate(go: (path: string) => void) {
  const reduced = useReducedMotion();
  return useCallback((path: string, to: V3) => {
    if (gate.phase === 'leaving') return;
    if (reduced) { go(path); return; }
    gate.phase = 'leaving';
    gate.t = 0;
    gate.fromSet = false;
    gate.to.set(to[0], to[1], to[2]);
    gate.path = path;
    gate.go = go;
  }, [go, reduced]);
}

/** Streaks of light and a black veil that follow the camera. Put one in every scene that uses `useGate` / `useWalk`. */
export function Tunnel() {
  const group = useRef<THREE.Group>(null);
  const streaks = useRef<THREE.InstancedMesh>(null);
  const veil = useRef<THREE.MeshBasicMaterial>(null);
  const dot = useRef<THREE.MeshBasicMaterial>(null);
  const streakMat = useRef<THREE.MeshBasicMaterial>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const seeds = useMemo(() => Array.from({ length: N }, (_, i) => {
    const r = rng(i + 7);
    return { a: r() * Math.PI * 2, rad: 0.5 + r() * 3.5, z: -r() * 30, f: 2 + r() * 10, ph: r() * 6.28 };
  }), []);

  useEffect(() => {
    // a room of ours opened right after a door: play the arrival. Otherwise clear any stale state.
    if (performance.now() < gate.arriveUntil) { gate.phase = 'arriving'; gate.t = 0; gate.arriveUntil = 0; } else gate.phase = 'idle';
  }, []);

  useFrame((state, delta) => {
    const g = group.current;
    const mesh = streaks.current;
    if (!g || !mesh) return;
    const dt = Math.min(delta, 0.05);
    const cam = state.camera as THREE.PerspectiveCamera;
    if (gate.phase === 'idle') { g.visible = false; return; }

    let intensity: number; let veilOp: number;
    if (gate.phase === 'leaving') {
      gate.t = Math.min(1, gate.t + dt / LEAVE);
      intensity = gate.t * gate.t;
      veilOp = THREE.MathUtils.smoothstep(gate.t, 0.55, 1);
      if (gate.t >= 1 && gate.go) {
        // the screen is black now: reset the lens, remember to play the arrival, and change room
        cam.fov = 60; cam.updateProjectionMatrix();
        gate.arriveUntil = performance.now() + 4000;
        const go = gate.go; gate.go = null;
        go(gate.path);
      }
    } else {
      gate.t = Math.min(1, gate.t + dt / ARRIVE);
      intensity = (1 - gate.t) * (1 - gate.t);
      veilOp = 1 - THREE.MathUtils.smoothstep(gate.t, 0, 0.55);
      if (gate.t >= 1) gate.phase = 'idle';
    }

    g.visible = true;
    g.position.copy(cam.position);
    g.quaternion.copy(cam.quaternion);
    if (veil.current) veil.current.opacity = veilOp;
    if (dot.current) dot.current.opacity = veilOp * 0.9;
    if (streakMat.current) streakMat.current.opacity = 0.9 * Math.max(intensity, veilOp * 0.25);

    const speed = 4 + 70 * intensity;
    const time = state.clock.elapsedTime;
    seeds.forEach((s, i) => {
      s.z += speed * dt;
      if (s.z > -0.6) s.z = -30;
      dummy.position.set(Math.cos(s.a) * s.rad, Math.sin(s.a) * s.rad, s.z);
      dummy.scale.set(0.012, 0.012, 0.4 + speed * 0.07);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
      const flash = Math.sin(time * s.f + s.ph) > 0.6 ? 1 : 0.2;   // lights flashing here and there
      mesh.setColorAt(i, color.setScalar(flash));
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  return (
    <group ref={group} visible={false}>
      <mesh position={[0, 0, -0.5]} renderOrder={1000}>
        <planeGeometry args={[8, 8]} />
        <meshBasicMaterial ref={veil} color="#000000" transparent opacity={0} depthTest={false} depthWrite={false} fog={false} />
      </mesh>
      <instancedMesh ref={streaks} args={[undefined, undefined, N]} frustumCulled={false} renderOrder={1001}>
        <boxGeometry args={[1, 1, 1]} />
        <meshBasicMaterial ref={streakMat} color="#ffffff" transparent opacity={0} blending={THREE.AdditiveBlending} depthTest={false} depthWrite={false} toneMapped={false} fog={false} />
      </instancedMesh>
      <mesh position={[0, 0, -0.45]} renderOrder={1002}>
        <circleGeometry args={[0.008, 12]} />
        <meshBasicMaterial ref={dot} color="#ffffff" transparent opacity={0} depthTest={false} depthWrite={false} fog={false} />
      </mesh>
    </group>
  );
}
