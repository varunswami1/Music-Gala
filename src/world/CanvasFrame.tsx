// A landscape "canvas" on a wall. Shows an artist photo cropped to fill the frame, or, when there is no photo, a collage of cover art.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useHover } from './useHover';

type V3 = [number, number, number];

/** Loads a texture and reports failure (so the caller can fall back to the collage). */
function useImage(url?: string | null) {
  const [state, setState] = useState<{ tex: THREE.Texture | null; failed: boolean }>({ tex: null, failed: !url });
  useEffect(() => {
    if (!url) { setState({ tex: null, failed: true }); return; }
    let live = true; let loaded: THREE.Texture | null = null;
    setState({ tex: null, failed: false });
    new THREE.TextureLoader().setCrossOrigin('anonymous').load(url, (t) => {
      if (!live) { t.dispose(); return; }
      t.colorSpace = THREE.SRGBColorSpace; loaded = t; setState({ tex: t, failed: false });
    }, undefined, () => { if (live) setState({ tex: null, failed: true }); });
    return () => { live = false; loaded?.dispose(); };
  }, [url]);
  return state;
}

/** Scales the texture so it fills a w:h box with no stretching (centre crop). */
function coverFit(tex: THREE.Texture, w: number, h: number) {
  const img = tex.image as { width: number; height: number } | undefined;
  if (!img?.width || !img.height) return;
  const ia = img.width / img.height, fa = w / h;
  tex.repeat.set(ia > fa ? fa / ia : 1, ia > fa ? 1 : ia / fa);
  tex.offset.set((1 - tex.repeat.x) / 2, (1 - tex.repeat.y) / 2);
  tex.needsUpdate = true;
}

function Tile({ url, x, y, w, h }: { url: string; x: number; y: number; w: number; h: number }) {
  const { tex } = useImage(url);
  useMemo(() => { if (tex) coverFit(tex, w, h); }, [tex, w, h]);
  return (
    <mesh position={[x, y, 0.005]}>
      <planeGeometry args={[w - 0.04, h - 0.04]} />
      {tex ? <meshBasicMaterial map={tex} color="#d0d0d0" /> : <meshBasicMaterial color="#141414" />}
    </mesh>
  );
}

function layoutFor(n: number): [number, number] {
  if (n >= 8) return [4, 2]; if (n >= 6) return [3, 2]; if (n >= 4) return [2, 2]; if (n >= 2) return [2, 1]; return [1, 1];
}

interface Props {
  title: string;
  imageUrl?: string | null;
  collage?: string[];            // cover urls for the fallback collage
  maxTiles?: number;
  width?: number; height?: number;
  position: V3; rotation?: V3;
  accent?: string;
  caption?: string;
  fallbackText?: string;         // shown on the blank canvas when there is no image and no collage (default: the first letter)
  hoverLabel?: string;
  ceiling?: number | null;       // world y of the ceiling; the frame hangs from it on two wires and sways a little. null = no wires
  onOpen?: () => void;
}

export function CanvasFrame({ title, imageUrl, collage = [], maxTiles = 8, width = 6, height = 3.6, position, rotation = [0, 0, 0], accent = '#ffffff', caption, fallbackText, hoverLabel = '', ceiling = 7.4, onOpen }: Props) {
  const { tex, failed } = useImage(imageUrl);
  useMemo(() => { if (tex) coverFit(tex, width, height); }, [tex, width, height]);
  const { hover, bind } = useHover(onOpen ? hoverLabel || 'OPEN' : '');
  const grp = useRef<THREE.Group>(null), sway = useRef<THREE.Group>(null);
  const L = ceiling == null ? 0 : Math.max(0.6, ceiling - (position[1] + height / 2));   // wire length from the top edge to the ceiling
  const phase = useMemo(() => Math.random() * 6, []);
  const wires = useMemo(() => new THREE.BufferGeometry().setFromPoints([-1, 1].flatMap((sx) => [new THREE.Vector3(sx * (width / 2 - 0.25), height / 2, 0.01), new THREE.Vector3(sx * (width / 2 - 0.25), height / 2 + L, 0.01)])), [width, height, L]);
  useFrame(({ clock }) => { if (sway.current && L > 0) { const t = clock.getElapsedTime() + phase; sway.current.rotation.z = Math.sin(t * 0.5) * 0.006; sway.current.rotation.x = Math.sin(t * 0.37) * 0.004; }
    if (grp.current) grp.current.scale.setScalar(THREE.MathUtils.lerp(grp.current.scale.x, hover && onOpen ? 1.025 : 1, 0.15)); });
  const edge = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(width, height)), [width, height]);
  const edge2 = useMemo(() => new THREE.EdgesGeometry(new THREE.PlaneGeometry(width + 0.28, height + 0.28)), [width, height]);
  const tiles = useMemo(() => [...new Set(collage)].slice(0, maxTiles), [collage, maxTiles]);
  const showCollage = !tex && failed && tiles.length > 0;
  const [cols, rows] = layoutFor(tiles.length);
  const shown = showCollage ? tiles.slice(0, cols * rows) : [];
  const tw = width / cols, th = height / rows;
  return (
    <group position={[position[0], position[1] + height / 2 + L, position[2]]} rotation={rotation}>
      <group ref={sway}><group position-y={-(L + height / 2)}>
      {L > 0 && <lineSegments geometry={wires}><lineBasicMaterial color={accent} transparent opacity={0.45} /></lineSegments>}
      <group ref={grp}>
        <mesh {...bind} onClick={(e) => { e.stopPropagation(); if (e.delta > 6) return; onOpen?.(); }}>
          <planeGeometry args={[width, height]} />
          {tex ? <meshBasicMaterial map={tex} color={hover ? '#ffffff' : '#cfcfcf'} /> : <meshBasicMaterial color="#0a0a0a" />}
        </mesh>
        {shown.map((u, i) => (
          <Tile key={u} url={u} w={tw} h={th} x={-width / 2 + tw * (i % cols) + tw / 2} y={height / 2 - th * Math.floor(i / cols) - th / 2} />
        ))}
        {!tex && !showCollage && failed && (
          fallbackText
            ? <Text position={[0, 0, 0.01]} fontSize={Math.min(width, height) * 0.1} letterSpacing={0.05} color="#bdbdbd" anchorX="center" anchorY="middle" maxWidth={width * 0.8} textAlign="center">{fallbackText}</Text>
            : <Text position={[0, 0, 0.01]} fontSize={height * 0.5} color="#2a2a2a" anchorX="center" anchorY="middle">{(title.trim()[0] ?? '·').toUpperCase()}</Text>
        )}
        <lineSegments geometry={edge} position-z={0.01}><lineBasicMaterial color={accent} transparent opacity={hover ? 1 : 0.8} /></lineSegments>
        <lineSegments geometry={edge2} position-z={0.01}><lineBasicMaterial color={accent} transparent opacity={0.3} /></lineSegments>
        {caption && <Text position={[-width / 2, -height / 2 - 0.3, 0.01]} fontSize={Math.max(0.14, height * 0.06)} letterSpacing={0.1} color="#9a9a9a" anchorX="left" anchorY="top" maxWidth={width}>{caption.toUpperCase()}</Text>}
      </group>
      </group></group>
    </group>
  );
}
