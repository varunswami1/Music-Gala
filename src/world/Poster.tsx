import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useHover } from './useHover';

type V3 = [number, number, number];

/** Loads an image as a texture. Never throws: returns null while loading or on error (CORS, 404). */
export function useCover(url?: string | null) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!url) { setTex(null); return; }
    let live = true;
    let loaded: THREE.Texture | null = null;
    new THREE.TextureLoader().setCrossOrigin('anonymous').load(url, (t) => {
      if (!live) { t.dispose(); return; }
      t.colorSpace = THREE.SRGBColorSpace; loaded = t; setTex(t);
    }, undefined, () => { /* keep placeholder */ });
    return () => { live = false; loaded?.dispose(); };
  }, [url]);
  return tex;
}

const hue = (s: string) => { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 360; return h; };

interface PosterProps {
  title: string;
  coverUrl?: string | null;
  caption?: string;
  position: V3;
  rotation?: V3;
  size?: number | [number, number];
  accent?: string;
  hoverLabel?: string;
  onOpen?: () => void;
  onDoubleOpen?: () => void;
}

/** A framed picture in the world. Used for covers, artist portraits and card-ring cards.
 *  Keyboard: when onDoubleOpen or onOpen is given, the poster is reachable by Tab/arrows and opens with Enter (double-open wins). Props are stable. */
export function Poster({ title, coverUrl, caption, position, rotation = [0, 0, 0], size = 1.6, accent = '#ffffff', hoverLabel = 'OPEN', onOpen, onDoubleOpen }: PosterProps) {
  const [w, h] = Array.isArray(size) ? size : [size, size];
  const tex = useCover(coverUrl);
  const { hover, bind } = useHover(hoverLabel, onDoubleOpen ?? onOpen, hoverLabel || title);
  const group = useRef<THREE.Group>(null);
  const frame = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(w + 0.1, h + 0.1)), [w, h]);
  useEffect(() => () => frame.dispose(), [frame]);
  useFrame(() => { if (group.current) group.current.scale.setScalar(THREE.MathUtils.lerp(group.current.scale.x, hover ? 1.07 : 1, 0.15)); });
  return (
    <group position={position} rotation={rotation}>
      <group ref={group}>
        <mesh {...bind} onClick={(e) => { e.stopPropagation(); onOpen?.(); }} onDoubleClick={(e) => { e.stopPropagation(); onDoubleOpen?.(); }}>
          <planeGeometry args={[w, h]} />
          {tex ? <meshBasicMaterial map={tex} color={hover ? '#ffffff' : '#c4c4c4'} /> : <meshBasicMaterial color={`hsl(${hue(title)}, 35%, ${hover ? 24 : 16}%)`} />}
        </mesh>
        <lineSegments geometry={frame} position-z={0.01}>
          <lineBasicMaterial color={accent} transparent opacity={hover ? 1 : 0.55} />
        </lineSegments>
        {caption && <Text position={[0, -h / 2 - 0.22, 0.01]} fontSize={0.13} color="#9a9a9a" anchorY="top" maxWidth={w + 1}>{caption}</Text>}
      </group>
    </group>
  );
}
