// The shared round room for Song and Artist rooms. Owner: Person 4. Everything created here is disposed on unmount.
import { useEffect, useMemo, useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import { Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import { WireCylinder } from '../../world/Wire';
import { Poster } from '../../world/Poster';

type V3 = [number, number, number];
const CENTER_Z = -2, RADIUS = 10, HEIGHT = 8, POSTER_Z = -5;

/** Door placement on the back wall: `deg` is the angle from straight ahead (+ = right). Faces the room centre. */
export function doorAt(deg: number, r = 8.8): { position: V3; rotation: V3 } {
  const a = (deg * Math.PI) / 180;
  const x = r * Math.sin(a), z = CENTER_Z - r * Math.cos(a);
  return { position: [x, 0, z], rotation: [0, Math.atan2(-x, CENTER_Z - z), 0] };
}

const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function Glow({ tint, position, size }: { tint: string; position: V3; size: [number, number] }) {
  const material = useMemo(() => new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color() }, uStrength: { value: 0.32 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'varying vec2 vUv; uniform vec3 uColor; uniform float uStrength; void main(){ float a = smoothstep(0.5, 0.0, distance(vUv, vec2(0.5))); gl_FragColor = vec4(uColor * a * a * uStrength, 1.0); }',
  }), []);
  useEffect(() => { (material.uniforms.uColor.value as THREE.Color).setStyle(tint, THREE.LinearSRGBColorSpace); }, [material, tint]);
  useEffect(() => () => material.dispose(), [material]);
  return (
    <mesh position={position} raycast={() => null} material={material}>
      <planeGeometry args={size} />
    </mesh>
  );
}

function FloorRings({ tint }: { tint: string }) {
  const rings = useMemo(() => [3.5, 6.5, 9.8].map((r) => Array.from({ length: 73 }, (_, i) => {
    const a = (i / 72) * Math.PI * 2;
    return [Math.cos(a) * r, 0.02, Math.sin(a) * r] as V3;
  })), []);
  return (
    <group position={[0, 0, CENTER_Z]}>
      {rings.map((pts, i) => <Line key={i} points={pts} color={tint} transparent opacity={0.28 - i * 0.07} />)}
    </group>
  );
}

interface RoundRoomProps {
  word: string;           // giant outline word on the back wall
  title: string;
  image?: string | null;
  size: number | [number, number];
  tint: string;
  caption?: string;
  playing?: boolean;      // pulse the frame only while audio is really playing
  posterLabel?: string;   // cursor label when the picture is clickable ('' = not clickable)
  onPoster?: () => void;
  children?: ReactNode;   // doors
}

export function RoundRoom({ word, title, image, size, tint, caption, playing = false, posterLabel = '', onPoster, children }: RoundRoomProps) {
  const [w, h] = Array.isArray(size) ? size : [size, size];
  const top = HEIGHT, py = 2.5 + (h - 3.4) / 2; // picture centre; grows upward for tall portraits
  const sway = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.LineBasicMaterial>(null);
  const still = useMemo(reducedMotion, []);
  const frame = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(w + 0.35, h + 0.35)), [w, h]);
  useEffect(() => () => frame.dispose(), [frame]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (sway.current && !still) sway.current.rotation.z = Math.sin(t * 0.45) * 0.004; // tiny pendulum from the ceiling
    if (pulse.current) pulse.current.opacity = playing ? 0.35 + 0.35 * Math.sin(t * 3) ** 2 : 0;
  });
  const short = word.trim().toUpperCase().slice(0, 18);
  const cableX = Math.min(w / 2 - 0.1, 1.6);
  const topY = py + h / 2 - top; // relative to the ceiling pivot
  return (
    <group>
      <WireCylinder radius={RADIUS} height={HEIGHT} position={[0, HEIGHT / 2, CENTER_Z]} color={tint} opacity={0.4} />
      <FloorRings tint={tint} />
      <Glow tint={tint} position={[0, py, POSTER_Z - 0.4]} size={[w * 3.4, h * 2.6]} />
      {short && (
        <Text position={[0, 4.4, -9.6]} fontSize={short.length > 10 ? 1.5 : 2.3} maxWidth={17} textAlign="center" anchorX="center" anchorY="middle"
          fillOpacity={0} strokeWidth="0.5%" strokeColor={tint} strokeOpacity={0.3} raycast={() => null}>{short}</Text>
      )}
      <group ref={sway} position={[0, top, POSTER_Z]}>
        <Line points={[[-cableX, topY, 0], [-cableX * 0.7, 0, 0]]} color="#ffffff" transparent opacity={0.4} />
        <Line points={[[cableX, topY, 0], [cableX * 0.7, 0, 0]]} color="#ffffff" transparent opacity={0.4} />
        <Line points={[[-cableX * 0.7, 0, 0], [cableX * 0.7, 0, 0]]} color="#ffffff" transparent opacity={0.4} />
        <lineSegments geometry={frame} position={[0, py - top, 0.02]}>
          <lineBasicMaterial ref={pulse} color={tint} transparent opacity={0} />
        </lineSegments>
        <Poster title={title} coverUrl={image} size={size} position={[0, py - top, 0]} accent={tint} hoverLabel={posterLabel} onOpen={posterLabel ? onPoster : undefined} caption={caption} />
        {!image && (
          <Text position={[0, py - top, 0.03]} fontSize={Math.min(w, h) * 0.45} color={tint} fillOpacity={0.35} anchorX="center" anchorY="middle" raycast={() => null}>
            {title.trim().charAt(0).toUpperCase() || '·'}
          </Text>
        )}
      </group>
      {children}
    </group>
  );
}
