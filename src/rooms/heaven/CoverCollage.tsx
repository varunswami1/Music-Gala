// A grid of album covers drawn on one surface (used inside hanging frames). Owner: Person 3.
// Missing covers fall back to calm dark tiles. Tiles are not pointer-interactive; the frame owns the hit area.
import { useCover } from '../../world/Poster';

const hue = (n: number) => (n * 47 + 200) % 360;

function Tile({ url, seed, position, size, hover }: { url: string | null; seed: number; position: [number, number, number]; size: number; hover: boolean }) {
  const tex = useCover(url);
  return (
    <mesh position={position} raycast={() => null}>
      <planeGeometry args={[size, size]} />
      {tex
        ? <meshBasicMaterial key="tex" map={tex} color={hover ? '#ffffff' : '#b5b5b5'} />
        : <meshBasicMaterial key="none" color={`hsl(${hue(seed)}, 25%, ${hover ? 18 : 12}%)`} />}
    </mesh>
  );
}

export function CoverCollage({ covers, grid = 2, size, hover = false }: { covers: (string | null)[]; grid?: number; size: number; hover?: boolean }) {
  const gap = 0.04;
  const tile = (size - gap * (grid - 1)) / grid;
  return (
    <group>
      {Array.from({ length: grid * grid }, (_, i) => {
        const c = i % grid, r = Math.floor(i / grid);
        return <Tile key={i} url={covers[i] ?? null} seed={i} size={tile} hover={hover}
          position={[-size / 2 + tile / 2 + c * (tile + gap), size / 2 - tile / 2 - r * (tile + gap), 0]} />;
      })}
    </group>
  );
}
