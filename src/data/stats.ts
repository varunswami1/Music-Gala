// Listening statistics for the Taste room. Owner: Person 5. Pure functions over the library; no I/O.
import type { Artist, Library, Room, Song } from '../contract/types';
import { languageOf } from './languages';

export interface Bucket { label: string; count: number }
export interface TasteStats {
  total: number;
  favourites: number;
  artistCount: number;
  scenes: { room: Room; count: number }[];
  topArtists: { artist: Artist | null; name: string; count: number }[];
  years: Bucket[];
  undated: number;
}

/** `languageId` null = whole library; otherwise only songs of that language (language = filter, scene = room). */
export function tasteStats(lib: Library, languageId: string | null, yearSpan = 14): TasteStats {
  const songs: Song[] = languageId ? lib.songs.filter((s) => languageOf(s) === languageId) : lib.songs;

  const sceneCount = new Map<string, number>();
  const artistCount = new Map<string, number>();
  const yearCount = new Map<number, number>();
  let favourites = 0, undated = 0;
  for (const s of songs) {
    sceneCount.set(s.roomId, (sceneCount.get(s.roomId) ?? 0) + 1);
    if (s.isFavourite) favourites++;
    for (const id of s.artistIds) artistCount.set(id, (artistCount.get(id) ?? 0) + 1);
    if (s.year) yearCount.set(s.year, (yearCount.get(s.year) ?? 0) + 1); else undated++;
  }

  const scenes = lib.rooms.map((room) => ({ room, count: sceneCount.get(room.id) ?? 0 }));
  const topArtists = [...artistCount.entries()]
    .map(([id, count]) => { const artist = lib.artistsById.get(id) ?? null; return { artist, name: artist?.name ?? 'Unknown', count }; })
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, 12);

  // Last `yearSpan` calendar years up to the newest year present; everything older is folded into one bucket.
  const known = [...yearCount.keys()];
  const years: Bucket[] = [];
  if (known.length) {
    const newest = Math.max(...known), first = newest - yearSpan + 1;
    let older = 0;
    for (const [y, c] of yearCount) if (y < first) older += c;
    if (older) years.push({ label: `<${first}`, count: older });
    for (let y = first; y <= newest; y++) years.push({ label: String(y).slice(2), count: yearCount.get(y) ?? 0 });
  }
  return { total: songs.length, favourites, artistCount: artistCount.size, scenes, topArtists, years, undated };
}
