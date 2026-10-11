import { Suspense, useEffect, useLayoutEffect, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import type { PerspectiveCamera } from 'three';
import { Atmosphere } from './Atmosphere';
import { TransitionDirector } from './TransitionDirector';
import { findRoom } from '../rooms/registry';
import { cam, kickPush, PUSH_IN, PUSH_OUT, setCameraRoom, setPushTarget, stepCamera } from './cameraInput';
import { useCameraInput } from './useCameraInput';
import type { Phase } from './useTransition';
import { useApp } from '../store/app';

const BASE_FOV = 60;
const PUSH_FOV = 10; // extra degrees at full push: a small "rush through the door"

/** Eases the shared camera input every frame and drives the room-change push (+ FOV). */
function CameraRig({ phase }: { phase: Phase }) {
  const reduced = useApp((s) => s.reducedMotion);
  useEffect(() => {
    if (reduced) { setPushTarget(0); return; }
    if (phase === 'out') setPushTarget(PUSH_OUT);
    else {
      if (phase === 'in') kickPush(-PUSH_IN); // new room starts a little behind its spot and glides in (hidden by the fade)
      setPushTarget(0);
    }
  }, [phase, reduced]);
  useFrame((state, dt) => {
    stepCamera(dt, reduced);
    const c = state.camera as PerspectiveCamera;
    const want = BASE_FOV + (reduced ? 0 : PUSH_FOV * Math.max(0, Math.min(1, cam.push / PUSH_OUT)));
    if (Math.abs(c.fov - want) > 0.01) { c.fov = want; c.updateProjectionMatrix(); }
  });
  return null;
}

/** If the average frame rate stays under ~40 fps for three 2-second windows, drop to 'low' quality. Never goes back up. */
function QualityGuard() {
  const setQuality = useApp((s) => s.setQuality);
  const acc = useRef({ frames: 0, time: 0, windows: 0, bad: 0 });
  useFrame((_, dt) => {
    if (useApp.getState().quality === 'low' || document.hidden || dt > 0.5) return;
    const a = acc.current;
    a.frames += 1; a.time += dt;
    if (a.time < 2) return;
    const fps = a.frames / a.time;
    a.frames = 0; a.time = 0; a.windows += 1;
    if (a.windows <= 2) return; // ignore start-up (texture loading)
    a.bad = fps < 40 ? a.bad + 1 : 0;
    if (a.bad >= 3) setQuality('low');
  });
  return null;
}

/** The ONE persistent 3D canvas. Rooms swap inside it, so the world feels connected. Owner: Person 1.
 *  `shownPath` is the route being shown (it lags the URL during a transition); `phase` drives the push. */
export function WorldCanvas({ shownPath, phase }: { shownPath: string; phase: Phase }) {
  const hit = findRoom(shownPath);
  const Scene = hit?.room.Scene;
  const quality = useApp((s) => s.quality);
  const box = useRef<HTMLDivElement>(null);
  useCameraInput(box);
  // layout effect: runs before any Scene's own effects, so a room's useRoomCamera overrides are never wiped
  useLayoutEffect(() => { setCameraRoom(hit?.room.id ?? null); }, [shownPath]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div ref={box} className={'world' + (phase === 'out' ? ' busy' : '')}>
      <Canvas flat dpr={quality === 'low' ? 1 : [1, 1.75]} camera={{ fov: BASE_FOV, near: 0.1, far: 200, position: [0, 1.6, 8] }}>
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 9, 42]} />
        <CameraRig phase={phase} />
        <TransitionDirector />
        <QualityGuard />
        <Atmosphere />
        <Suspense fallback={null}>
          {hit && Scene && <Scene key={hit.room.id + JSON.stringify(hit.params)} params={hit.params} />}
        </Suspense>
      </Canvas>
    </div>
  );
}
