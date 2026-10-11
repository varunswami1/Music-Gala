// The shared round room for the Song and Artist rooms. Owner: Person 4.
// Plain black and white like the reference: no colour theme, no glow. A big picture hangs from the ceiling.
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { WireCylinder } from '../../world/Wire';
import { Poster } from '../../world/Poster';

type V3 = [number, number, number];
const CENTER_Z = -4, RADIUS = 16, HEIGHT = 12, POSTER_Z = -8, PICTURE_BOTTOM = 0.8;

/** Where the camera sits and looks in these rooms (the picture's centre is at y = 5.3 for a 9-high picture). */
export const ROOM_CAMERA: { position: V3; look: V3 } = { position: [0, 2, 9], look: [0, 5.3, -8] };
/** Picture sizes (height 9 in both so the camera framing is the same). */
export const COVER_SIZE: [number, number] = [9, 9];
export const PORTRAIT_SIZE: [number, number] = [7.2, 9];

/**
 * A door on the wall, `deg` degrees from straight ahead (+ right). 110 puts it beside and slightly behind the starting
 * view, so you have to turn (drag or arrow keys) to find it. Faces the room centre.
 */
export function doorAt(deg: number, r = RADIUS - 1): { position: V3; rotation: V3; size: [number, number] } {
  const a = (deg * Math.PI) / 180;
  const x = r * Math.sin(a), z = CENTER_Z - r * Math.cos(a);
  return { position: [x, 0, z], rotation: [0, Math.atan2(-x, CENTER_Z - z), 0], size: [2.4, 3.8] };
}

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

interface RoundRoomProps {
  word: string;           // giant outline word behind the picture
  title: string;
  image?: string | null;
  size: number | [number, number];
  caption?: string;
  posterLabel?: string;   // cursor label when the picture is clickable ('' = not clickable)
  onPoster?: () => void;
  children?: ReactNode;   // doors
}

export function RoundRoom({ word, title, image, size, caption, posterLabel = '', onPoster, children }: RoundRoomProps) {
  const [w, h] = Array.isArray(size) ? size : [size, size];
  const sway = useRef<THREE.Group>(null);
  const still = useMemo(reducedMotion, []);
  useFrame(({ clock }) => {
    if (sway.current && !still) sway.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.45) * 0.003; // tiny pendulum
  });
  const short = word.trim().toUpperCase().slice(0, 18);
  const centreY = PICTURE_BOTTOM + h / 2;
  const topY = centreY + h / 2 - HEIGHT; // picture top, relative to the ceiling pivot
  const cableX = Math.min(w / 2 - 0.2, 3.2);
  return (
    <group>
      <WireCylinder radius={RADIUS} height={HEIGHT} position={[0, HEIGHT / 2, CENTER_Z]} opacity={0.35} />
      {short && (
        <Text position={[0, 12, -12]} fontSize={short.length > 10 ? 1.9 : 2.8} maxWidth={26} textAlign="center" anchorX="center" anchorY="middle"
          fillOpacity={0} strokeWidth="0.5%" strokeColor="#ffffff" strokeOpacity={0.3} raycast={() => null}>{short}</Text>
      )}
      <group ref={sway} position={[0, HEIGHT, POSTER_Z]}>
        <Line points={[[-cableX, topY, 0], [-cableX * 0.8, 0, 0]]} color="#ffffff" transparent opacity={0.4} />
        <Line points={[[cableX, topY, 0], [cableX * 0.8, 0, 0]]} color="#ffffff" transparent opacity={0.4} />
        <Line points={[[-cableX * 0.8, 0, 0], [cableX * 0.8, 0, 0]]} color="#ffffff" transparent opacity={0.4} />
        <Poster title={title} coverUrl={image} size={size} position={[0, centreY - HEIGHT, 0]} accent="#ffffff"
          hoverLabel={posterLabel} onOpen={posterLabel ? onPoster : undefined} caption={caption} />
        {!image && (
          <Text position={[0, centreY - HEIGHT, 0.03]} fontSize={Math.min(w, h) * 0.45} color="#ffffff" fillOpacity={0.3} anchorX="center" anchorY="middle" raycast={() => null}>
            {title.trim().charAt(0).toUpperCase() || '·'}
          </Text>
        )}
      </group>
      {children}
    </group>
  );
}
