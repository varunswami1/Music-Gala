import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Atmosphere } from './Atmosphere';
import { TransitionDirector } from './TransitionDirector';
import { findRoom } from '../rooms/registry';

/** The ONE persistent 3D canvas. Rooms swap inside it, so the world feels connected. Owner: Person 1. */
export function WorldCanvas({ pathname }: { pathname: string }) {
  const hit = findRoom(pathname);
  const Scene = hit?.room.Scene;
  return (
    <div className="world">
      <Canvas flat dpr={[1, 1.75]} camera={{ fov: 60, near: 0.1, far: 200, position: [0, 1.6, 8] }}>
        <color attach="background" args={['#000000']} />
        <fog attach="fog" args={['#000000', 8, 45]} />
        <Atmosphere />
        <TransitionDirector />
        <Suspense fallback={null}>
          {hit && Scene && <Scene key={hit.room.id + JSON.stringify(hit.params)} params={hit.params} />}
        </Suspense>
      </Canvas>
    </div>
  );
}
