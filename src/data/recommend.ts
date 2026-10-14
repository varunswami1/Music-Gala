// Recommendation service. Owner: Person 5.
// Two lists for a song, matching the "From library / New" tabs:
//   fromLibrary: songs you already have, scored from shared artist, related artists, scene, tags and era (computed here)
//   outside:     songs/artists NOT in the library, each with a reason, read from public/data/recommendations.json:
//                  byArtist  made OFFLINE by scripts/build_recs_from_profiles.py from the YouTube Music profile data (no key needed)
//                  bySong    made by scripts/build_recs.py from Last.fm (needs your key); wins over byArtist when present
//                  related   library artists related to each artist, used to rank "From library"
//                Each outside item is marked inLibrary, computed here against the current library.
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
  kind: 'song' | 'artist';     // 'artist' = an artist worth exploring (title is the artist's name), not a single song
}
export interface Recommendations { fromLibrary: Rec[]; outside: Rec[]; outsideAvailable: boolean }

interface RawRec { kind?: unknown; title?: unknown; artist?: unknown; reason?: unknown; youtubeId?: unknown; coverUrl?: unknown; source?: unknown }
interface RecFile { byArtist: Record<string, RawRec[]>; bySong: Record<string, RawRec[]>; related: Record<string, string[]> }

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
      if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
      const r = raw as Partial<RecFile> & Record<string, unknown>;
      // older files were just {songId: [...]}: treat those as bySong
      if (!r.byArtist && !r.bySong && !r.related) return { byArtist: {}, bySong: r as unknown as RecFile['bySong'], related: {} };
      return { byArtist: r.byArtist ?? {}, bySong: r.bySong ?? {}, related: r.related ?? {} };
    } catch { return null; }
  })().then((f) => (file = f));
  return loading;
}

/** Songs already in the library that fit `seed`, best first. Every item carries the reason it was picked. */
export function similarFromLibrary(lib: Library, seed: Song, limit = 12, related: string[] = []): Rec[] {
  const seedTags = new Set([...seed.tags, ...seed.genreTags].map((t) => t.toLowerCase()));
  const scored: { s: Song; score: number; why: string[] }[] = [];
  for (const s of lib.songs) {
    if (s.id === seed.id) continue;
    let score = 0; const why: string[] = [];
    const rel = s.artistIds.find((a) => related.includes(a));
    if (rel) { score += 3.5; why.push(`by ${s.artistNames[s.artistIds.indexOf(rel)] ?? 'a related artist'}, related to ${seed.artistNames[0] ?? 'this artist'}`); }
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
    inLibrary: true, songId: s.id, coverUrl: s.coverUrl, youtubeId: s.youtubeId, source: 'Your library', kind: 'song',
  }));
}

/** Suggestions from outside the library for `seed`. Empty (and available=false) when no recommendations.json exists. */
async function similarOutside(lib: Library, seed: Song, limit: number, f: RecFile | null): Promise<{ items: Rec[]; available: boolean }> {
  if (!f) return { items: [], available: false };
  const owned = new Map<string, Song>(), ownedYt = new Map<string, Song>();
  for (const s of lib.songs) { owned.set(key(s.title, s.artistNames[0] ?? ''), s); if (s.youtubeId) ownedYt.set(s.youtubeId, s); }
  const raw: RawRec[] = [...(f.bySong[seed.id] ?? [])];
  for (const a of seed.artistIds) for (const r of f.byArtist[a] ?? []) raw.push(r);
  const items: Rec[] = [], seen = new Set<string>();
  for (const r of raw) {
    const title = clean(r.title), artist = clean(r.artist);
    if (!title || !artist) continue;
    const kind = r.kind === 'artist' ? 'artist' : 'song';
    const k = key(title, artist); if (seen.has(k)) continue; seen.add(k);
    const yt = clean(r.youtubeId);
    const mine = kind === 'song' ? ((yt ? ownedYt.get(yt) : undefined) ?? owned.get(k)) : undefined;
    items.push({
      title, artist, kind, reason: clean(r.reason) ?? 'similar listeners also play this',
      inLibrary: !!mine, songId: mine?.id ?? null,
      coverUrl: clean(r.coverUrl) ?? mine?.coverUrl ?? null, youtubeId: yt, source: clean(r.source) ?? 'Recommendation service',
    });
  }
  return { items: items.slice(0, limit), available: true };
}

/** True when the offline/Last.fm data has "New" suggestions for this song (lets the Discover room offer these as seeds first). */
export function hasOutside(seed: Song): boolean {
  const f = file; if (!f) return false;
  return (f.bySong[seed.id]?.length ?? 0) > 0 || seed.artistIds.some((a) => (f.byArtist[a]?.length ?? 0) > 0);
}
export const warmRecommendations = () => loadFile().then(() => undefined);

export async function getRecommendations(lib: Library, seed: Song, limit = 12): Promise<Recommendations> {
  const f = await loadFile();
  const related = seed.artistIds.flatMap((a) => f?.related[a] ?? []);
  const out = await similarOutside(lib, seed, limit, f);
  return { fromLibrary: similarFromLibrary(lib, seed, limit, related), outside: out.items, outsideAvailable: out.available };
}

/** Link to search for a suggestion on YouTube Music. Opens the official site; nothing is played or extracted here. */
export const searchUrl = (r: Pick<Rec, 'title' | 'artist' | 'kind'>) =>
  `https://music.youtube.com/search?q=${encodeURIComponent(r.kind === 'artist' ? r.title : `${r.title} ${r.artist}`)}`;
