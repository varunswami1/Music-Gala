// Recommendation service. Owner: Person 5.
// Two lists for a song, matching the "From library / New" tabs:
//   fromLibrary: songs you already have, scored from shared artist, scene, tags and era (computed here, always available)
//   outside:     songs NOT in the library, each with a reason (precomputed by scripts/build_recs.py into public/data/recommendations.json;
//                the API keys stay on your machine). Each is marked inLibrary, computed here against the current library.
import type { Library, Song } from '../contract/types';

export interface Rec {
  title: string;
  artist: string;
  reason: string;
  inLibrary: boolean;
  songId: string | null;       // set when inLibrary
  coverUrl: string | null;
  youtubeId: string | null;
  source: string;              // where the suggestion came from, e.g. "Last.fm similar tracks"
}
export interface Recommendations { fromLibrary: Rec[]; outside: Rec[]; outsideAvailable: boolean }

interface RawRec { title?: unknown; artist?: unknown; reason?: unknown; youtubeId?: unknown; coverUrl?: unknown; source?: unknown }
type RecFile = Record<string, RawRec[]>; // keyed by seed song id

/** Same normalisation as the Python pipeline, so title/artist matching agrees on both sides. */
export function norm(s: string): string {
  return s.normalize('NFKC').toLowerCase().replace(/[\p{P}\p{S}]/gu, '').replace(/\s+/g, ' ').trim();
}
const key = (title: string, artist: string) => `${norm(title)}|${norm(artist)}`;
const clean = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

let file: RecFile | null | undefined; // undefined = not loaded yet, null = missing
let loading: Promise<RecFile | null> | null = null;

async function loadFile(): Promise<RecFile | null> {
  if (file !== undefined) return file;
  loading ??= (async () => {
    try {
      const res = await fetch('/data/recommendations.json');
      // The dev server answers unknown paths with index.html (status 200), so check that this really is JSON.
      if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) return null;
      const raw = await res.json();
      return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as RecFile) : null;
    } catch { return null; }
  })().then((f) => (file = f));
  return loading;
}

/** Songs already in the library that fit `seed`, best first. Every item carries the reason it was picked. */
export function similarFromLibrary(lib: Library, seed: Song, limit = 12): Rec[] {
  const seedTags = new Set([...seed.tags, ...seed.genreTags].map((t) => t.toLowerCase()));
  const scored: { s: Song; score: number; why: string[] }[] = [];
  for (const s of lib.songs) {
    if (s.id === seed.id) continue;
    let score = 0; const why: string[] = [];
    const sharedArtist = s.artistIds.find((a) => seed.artistIds.includes(a));
    if (sharedArtist) { score += 5; why.push(`same artist, ${s.artistNames[s.artistIds.indexOf(sharedArtist)] ?? 'shared'}`); }
    const tags = [...s.tags, ...s.genreTags].map((t) => t.toLowerCase()).filter((t) => seedTags.has(t));
    if (tags.length) { score += Math.min(tags.length, 3) * 1.5; why.push(`shared tags: ${[...new Set(tags)].slice(0, 3).join(', ')}`); }
    if (s.roomId === seed.roomId) { score += 1; if (!why.length) why.push(`same scene, ${lib.rooms.find((r) => r.id === s.roomId)?.displayName ?? s.roomId}`); }
    if (s.album && s.album === seed.album) { score += 2; why.push('same album'); }
    if (s.year && seed.year && Math.abs(s.year - seed.year) <= 2) { score += 0.75; if (!why.length) why.push(`from around ${s.year}`); }
    if (s.isFavourite) score += 0.25;
    if (score >= 1.5) scored.push({ s, score, why });
  }
  scored.sort((a, b) => b.score - a.score || Number(!!b.s.coverUrl) - Number(!!a.s.coverUrl));
  return scored.slice(0, limit).map(({ s, why }) => ({
    title: s.title, artist: s.artistNames.join(', '), reason: why.join(' · ') || 'similar to this song',
    inLibrary: true, songId: s.id, coverUrl: s.coverUrl, youtubeId: s.youtubeId, source: 'Your library',
  }));
}

/** Suggestions from outside the library for `seed`. Empty (and outsideAvailable=false) when build_recs.py has not been run. */
async function similarOutside(lib: Library, seed: Song, limit: number): Promise<{ items: Rec[]; available: boolean }> {
  const f = await loadFile();
  if (!f) return { items: [], available: false };
  const owned = new Map<string, Song>();
  for (const s of lib.songs) owned.set(key(s.title, s.artistNames[0] ?? ''), s);
  const items: Rec[] = [];
  for (const r of f[seed.id] ?? []) {
    const title = clean(r.title), artist = clean(r.artist);
    if (!title || !artist) continue;
    const mine = owned.get(key(title, artist));
    items.push({
      title, artist, reason: clean(r.reason) ?? 'similar listeners also play this',
      inLibrary: !!mine, songId: mine?.id ?? null,
      coverUrl: clean(r.coverUrl) ?? mine?.coverUrl ?? null, youtubeId: clean(r.youtubeId), source: clean(r.source) ?? 'Recommendation service',
    });
  }
  return { items: items.slice(0, limit), available: true };
}

export async function getRecommendations(lib: Library, seed: Song, limit?: number): Promise<Recommendations>;
export async function getRecommendations(seed: Song, limit?: number): Promise<Rec[]>;
export async function getRecommendations(
  libOrSeed: Library | Song,
  seedOrLimit?: Song | number,
  limit = 12
): Promise<Recommendations | Rec[]> {
  if (libOrSeed && 'songs' in (libOrSeed as any)) {
    const lib = libOrSeed as Library;
    const seed = seedOrLimit as Song;
    const maxItems = typeof limit === 'number' ? limit : 12;
    const out = await similarOutside(lib, seed, maxItems);
    return { fromLibrary: similarFromLibrary(lib, seed, maxItems), outside: out.items, outsideAvailable: out.available };
  } else {
    const seed = libOrSeed as Song;
    const maxItems = typeof seedOrLimit === 'number' ? seedOrLimit : limit;
    const f = await loadFile();
    if (!f) return [];
    const items: Rec[] = [];
    for (const r of f[seed.id] ?? []) {
      const title = clean(r.title), artist = clean(r.artist);
      if (!title || !artist) continue;
      items.push({
        title, artist, reason: clean(r.reason) ?? 'similar listeners also play this',
        inLibrary: false, songId: null,
        coverUrl: clean(r.coverUrl), youtubeId: clean(r.youtubeId), source: clean(r.source) ?? 'Recommendation service',
      });
    }
    return items.slice(0, maxItems);
  }
}

/** Link to search for a suggestion on YouTube Music. Opens the official site; nothing is played or extracted here. */
export const searchUrl = (r: Pick<Rec, 'title' | 'artist'>) =>
  `https://music.youtube.com/search?q=${encodeURIComponent(`${r.title} ${r.artist}`)}`;
