// Pure aggregation for the Taste room (kept separate so it can be tested without a browser). Owner: Person 3.
import type { Library } from '../../contract/types';

export interface TasteBar { id: string; label: string; count: number; color?: string; coverUrl?: string | null }
export interface TasteStats {
  artists: TasteBar[];   // top artists by song count
  scenes: TasteBar[];    // every non-empty scene room
  years: TasteBar[];     // one bar per calendar year over the last <= 45 years that have songs (zero years kept so the axis is honest)
  totals: { songs: number; artists: number; scenes: number };
}

export function tasteStats(lib: Library, topArtists = 10, maxYears = 45): TasteStats {
  const artists = [...lib.artists]
    .sort((a, b) => b.songCount - a.songCount || a.name.localeCompare(b.name))
    .slice(0, topArtists)
    .map((a): TasteBar => ({
      id: a.id, label: a.name, count: a.songCount,
      coverUrl: (lib.songsByArtist.get(a.id) ?? []).find((s) => s.coverUrl)?.coverUrl ?? null,
    }));
  const scenes = lib.rooms
    .map((r): TasteBar => ({ id: r.id, label: r.displayName, count: lib.songsByRoom.get(r.id)?.length ?? 0, color: r.accent }))
    .filter((r) => r.count > 0);
  const counts = new Map<number, number>();
  for (const s of lib.songs) if (s.year != null && s.year > 1900 && s.year < 2100) counts.set(s.year, (counts.get(s.year) ?? 0) + 1);
  const ys = [...counts.keys()];
  const years: TasteBar[] = [];
  if (ys.length) {
    const max = Math.max(...ys), min = Math.max(Math.min(...ys), max - (maxYears - 1));
    for (let y = min; y <= max; y++) years.push({ id: String(y), label: String(y), count: counts.get(y) ?? 0 });
  }
  return { artists, scenes, years, totals: { songs: lib.songs.length, artists: lib.artists.length, scenes: scenes.length } };
}
