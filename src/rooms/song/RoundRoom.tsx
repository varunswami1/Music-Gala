// The shared round room for the Song and Artist rooms. Owner: Person 4.
// Plain black and white like the reference. A true cylinder, and a big curved picture with a curved trim hanging from the ceiling.
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useCover } from '../../world/Poster';
import { useHover } from '../../world/useHover';

type V3 = [number, number, number];
const CENTER_Z = -4, RADIUS = 16, HEIGHT = 13, POSTER_Z = -8, PICTURE_BOTTOM = 0.8, CURVE = 18;

/** Where the camera sits and looks (picture centre is y = 5.9 for a 10.2-high picture). Low pitch keeps walls upright. */
export const ROOM_CAMERA: { position: V3; look: V3 } = { position: [0, 4.6, 9], look: [0, 5.9, -8] };
export const COVER_SIZE: [number, number] = [10.2, 10.2];
export const PORTRAIT_SIZE: [number, number] = [8.2, 10.2];

/**
 * A door on the wall, `deg` degrees from straight ahead (+ right). 110 puts it beside and slightly behind the starting
 * view, so you turn (drag or arrow keys) to find it. Faces the room centre.
 */
export function doorAt(deg: number, r = RADIUS - 1): { position: V3; rotation: V3; size: [number, number] } {
  const a = (deg * Math.PI) / 180;
  const x = r * Math.sin(a), z = CENTER_Z - r * Math.cos(a);
  return { position: [x, 0, z], rotation: [0, Math.atan2(-x, CENTER_Z - z), 0], size: [2.4, 3.8] };
}

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const hue = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };

/** Exact circles top and bottom plus evenly spaced uprights: a clean cylinder, nothing slanted. */
function useCylinderWire() {
  const geo = useMemo(() => {
    const pts: number[] = [];
    const RING = 192, POSTS = 48;
    for (const y of [0, HEIGHT]) for (let i = 0; i < RING; i++) {
      const a0 = (i / RING) * Math.PI * 2, a1 = ((i + 1) / RING) * Math.PI * 2;
      pts.push(Math.cos(a0) * RADIUS, y, Math.sin(a0) * RADIUS, Math.cos(a1) * RADIUS, y, Math.sin(a1) * RADIUS);
    }
    for (let i = 0; i < POSTS; i++) {
      const a = (i / POSTS) * Math.PI * 2;
      pts.push(Math.cos(a) * RADIUS, 0, Math.sin(a) * RADIUS, Math.cos(a) * RADIUS, HEIGHT, Math.sin(a) * RADIUS);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
}

/** A w x h picture bent around a vertical axis `CURVE` units in front of it (concave towards the viewer). */
function curvedPlane(w: number, h: number, R: number, seg = 48) {
  const half = w / R / 2, pos: number[] = [], uv: number[] = [], idx: number[] = [];
  for (let i = 0; i <= seg; i++) {
    const phi = -half + (2 * half * i) / seg, x = R * Math.sin(phi), z = R * (1 - Math.cos(phi));
    pos.push(x, -h / 2, z, x, h / 2, z);
    uv.push(i / seg, 0, i / seg, 1);
    if (i < seg) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  return g;
}
/** Closed outline following the same curve, `pad` units outside the picture. */
function curvedFrame(w: number, h: number, R: number, pad: number, seg = 48): V3[] {
  const W = w + pad * 2, H = h + pad * 2, half = W / R / 2, top: V3[] = [], bottom: V3[] = [];
  for (let i = 0; i <= seg; i++) {
    const phi = -half + (2 * half * i) / seg, x = R * Math.sin(phi), z = R * (1 - Math.cos(phi)) + 0.02;
    bottom.push([x, -H / 2, z]); top.push([x, H / 2, z]);
  }
  return [...bottom, ...top.reverse(), bottom[0]];
}

function CurvedPicture({ w, h, title, image, label, onOpen, caption }: { w: number; h: number; title: string; image?: string | null; label: string; onOpen?: () => void; caption?: string }) {
  const tex = useCover(image);
  const { hover, bind } = useHover(label);
  const geo = useMemo(() => curvedPlane(w, h, CURVE), [w, h]);
  useEffect(() => () => geo.dispose(), [geo]);
  const clickable = !!label && !!onOpen;
  const trimOuter = useMemo(() => curvedFrame(w, h, CURVE, 0.28), [w, h]);
  const trimInner = useMemo(() => curvedFrame(w, h, CURVE, 0.06), [w, h]);
  return (
    <group>
      <mesh geometry={geo} {...(clickable ? bind : {})} onClick={clickable ? (e) => { e.stopPropagation(); onOpen?.(); } : undefined}>
        {tex
          ? <meshBasicMaterial map={tex} color={hover ? '#ffffff' : '#d0d0d0'} side={THREE.DoubleSide} />
          : <meshBasicMaterial color={`hsl(${hue(title)}, 8%, 14%)`} side={THREE.DoubleSide} />}
      </mesh>
      <Line points={trimInner} color="#ffffff" transparent opacity={hover ? 1 : 0.7} />
      <Line points={trimOuter} color="#ffffff" transparent opacity={hover ? 0.7 : 0.3} />
      {!image && <Text position={[0, 0, 0.06]} fontSize={Math.min(w, h) * 0.45} color="#ffffff" fillOpacity={0.3} anchorX="center" anchorY="middle" raycast={() => null}>{title.trim().charAt(0).toUpperCase() || '·'}</Text>}
      {caption && <Text position={[0, -h / 2 - 0.7, 0.02]} fontSize={0.3} color="#9a9a9a" anchorY="top" maxWidth={w + 2} raycast={() => null}>{caption}</Text>}
    </group>
  );
}

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
  const wire = useCylinderWire();
  const sway = useRef<THREE.Group>(null);
  const still = useMemo(reducedMotion, []);
  useFrame(({ clock }) => { if (sway.current && !still) sway.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.45) * 0.003; });
  const short = word.trim().toUpperCase().slice(0, 18);
  const centreY = PICTURE_BOTTOM + h / 2;
  const topY = centreY + h / 2 + 0.28 - HEIGHT; // trim top, relative to the ceiling pivot
  const cableX = Math.min(w / 2 - 0.2, 3.4);
  return (
    <group>
      <lineSegments geometry={wire} position={[0, 0, CENTER_Z]}>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.3} />
      </lineSegments>
      {short && (
        <Text position={[0, 13, -12]} fontSize={short.length > 10 ? 1.9 : 2.8} maxWidth={26} textAlign="center" anchorX="center" anchorY="middle"
          fillOpacity={0} strokeWidth="0.5%" strokeColor="#ffffff" strokeOpacity={0.3} raycast={() => null}>{short}</Text>
      )}
      <group ref={sway} position={[0, HEIGHT, POSTER_Z]}>
        <Line points={[[-cableX, topY, 0.3], [-cableX * 0.8, 0, 0]]} color="#ffffff" transparent opacity={0.4} />
        <Line points={[[cableX, topY, 0.3], [cableX * 0.8, 0, 0]]} color="#ffffff" transparent opacity={0.4} />
        <Line points={[[-cableX * 0.8, 0, 0], [cableX * 0.8, 0, 0]]} color="#ffffff" transparent opacity={0.4} />
        <group position={[0, centreY - HEIGHT, 0]}>
          <CurvedPicture w={w} h={h} title={title} image={image} label={posterLabel} onOpen={onPoster} caption={caption} />
        </group>
      </group>
      {children}
    </group>
  );
}
