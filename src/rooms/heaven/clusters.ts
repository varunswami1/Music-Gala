// Pure grouping of songs into "clusters" for the card ring. Owner: Person 3.
// One cluster = at most CLUSTER_SIZE cards = the only thing drawn at a time (see docs/DESIGN.md §8).
import type { Song } from '../../contract/types';

export type GroupMode = 'artist' | 'year' | 'all';
export interface Cluster { id: string; label: string; songs: Song[] }

export const CLUSTER_SIZE = 54;   // 18 columns x 3 rows
const MIN_ARTIST_SONGS = 5;       // artists with fewer songs are merged into "MORE ARTISTS"

/** Split a long list into evenly sized clusters of at most CLUSTER_SIZE. */
function chunk(idBase: string, label: string, songs: Song[]): Cluster[] {
  if (songs.length === 0) return [];
  if (songs.length <= CLUSTER_SIZE) return [{ id: idBase, label, songs }];
  const n = Math.ceil(songs.length / CLUSTER_SIZE);
  const per = Math.ceil(songs.length / n);
  return Array.from({ length: n }, (_, i) => ({
    id: `${idBase}#${i}`, label: `${label} · ${i + 1}/${n}`, songs: songs.slice(i * per, (i + 1) * per),
  }));
}

function byArtist(songs: Song[]): Cluster[] {
  const groups = new Map<string, { name: string; songs: Song[] }>();
  for (const s of songs) {
    const key = s.artistIds[0] ?? '_unknown';
    const g = groups.get(key);
    if (g) g.songs.push(s); else groups.set(key, { name: s.artistNames[0] ?? 'Unknown artist', songs: [s] });
  }
  const all = [...groups.entries()];
  const big = all.filter(([, g]) => g.songs.length >= MIN_ARTIST_SONGS)
    .sort((a, b) => b[1].songs.length - a[1].songs.length || a[1].name.localeCompare(b[1].name));
  const small = all.filter(([, g]) => g.songs.length < MIN_ARTIST_SONGS)
    .sort((a, b) => a[1].name.localeCompare(b[1].name))
    .flatMap(([, g]) => g.songs);
  return [
    ...big.flatMap(([key, g]) => chunk(`artist:${key}`, g.name.toUpperCase(), g.songs)),
    ...chunk('artist:_more', 'MORE ARTISTS', small),
  ];
}

function byYear(songs: Song[]): Cluster[] {
  const dated = new Map<number, Song[]>();
  const undated: Song[] = [];
  for (const s of songs) {
    if (s.year == null) { undated.push(s); continue; }
    const a = dated.get(s.year); if (a) a.push(s); else dated.set(s.year, [s]);
  }
  const years = [...dated.keys()].sort((a, b) => a - b);
  const out: Cluster[] = [];
  let bucket: Song[] = []; let from = 0; let to = 0;
  const flush = () => {
    if (!bucket.length) return;
    out.push({ id: `year:${from}-${to}`, label: from === to ? String(from) : `${from}–${to}`, songs: bucket });
    bucket = [];
  };
  for (const y of years) {
    const list = dated.get(y)!;
    if (list.length > CLUSTER_SIZE) { flush(); out.push(...chunk(`year:${y}`, String(y), list)); continue; }
    if (bucket.length && bucket.length + list.length > CLUSTER_SIZE) flush();
    if (!bucket.length) from = y;
    to = y; bucket = bucket.concat(list);
  }
  flush();
  out.push(...chunk('year:_undated', 'UNDATED', undated));
  return out;
}

export function buildClusters(songs: Song[], mode: GroupMode): Cluster[] {
  if (mode === 'artist') return byArtist(songs);
  if (mode === 'year') return byYear(songs);
  return chunk('all', 'ALL', songs);
}
