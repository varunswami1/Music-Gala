// Loads public/data/library.json (the output of the pipeline) and builds lookup tables. Owner: Person 5.
import { create } from 'zustand';
import type { Artist, Library, Room, Song } from '../contract/types';
import { applyExtra, loadArtistExtras, type ArtistExtras } from './artists';

function index<T>(items: T[], key: (t: T) => string): Map<string, T> {
  const m = new Map<string, T>();
  for (const it of items) m.set(key(it), it);
  return m;
}
function group<T>(items: T[], keys: (t: T) => string[]): Map<string, T[]> {
  const m = new Map<string, T[]>();
  for (const it of items) for (const k of keys(it)) { const a = m.get(k); if (a) a.push(it); else m.set(k, [it]); }
  return m;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalize(raw: any, extras: ArtistExtras = {}): Library {
  const rooms: Room[] = (raw.rooms ?? [])
    .filter((r: any) => r.kind === 'scene' || r.id === 'unsorted')
    .map((r: any) => ({ id: r.id, displayName: r.displayName, accent: r.accent, kind: r.kind, trackCount: r.trackCount ?? 0 }));
  const songs: Song[] = (raw.tracks ?? []).map((t: any) => ({
    id: t.id, title: t.title ?? 'Untitled', artistIds: t.artistIds ?? [], artistNames: t.artistNames ?? [],
    album: t.album ?? null, year: t.year ?? null, roomId: t.roomId ?? 'unsorted', wing: t.wing ?? null,
    isFavourite: !!t.isFavourite, tags: t.tags ?? [], genreTags: t.genreTags ?? [],
    coverUrl: t.coverUrl ?? null, youtubeId: t.youtubeId ?? null, needsReview: !!t.needsReview,
  }));
  const artists: Artist[] = (raw.artists ?? []).map((a: any) => applyExtra({
    id: a.id, name: a.name, subscribed: !!a.subscribed, roomId: a.roomId ?? 'unsorted', songCount: a.songCount ?? 0,
  }, extras[a.id]));
  const songsByRoom = group(songs, (s) => [s.roomId]);
  // favourites and songs with covers first, so rooms look good
  for (const list of songsByRoom.values())
    list.sort((a, b) => Number(b.isFavourite) - Number(a.isFavourite) || Number(!!b.coverUrl) - Number(!!a.coverUrl));
  return {
    rooms, songs, artists,
    songsById: index(songs, (s) => s.id),
    artistsById: index(artists, (a) => a.id),
    songsByRoom,
    songsByArtist: group(songs, (s) => s.artistIds),
  };
}

interface LibState {
  status: 'idle' | 'loading' | 'ready' | 'error';
  library: Library | null;
  error: string | null;
  load: () => Promise<void>;
}

export const useLibrary = create<LibState>((set, get) => ({
  status: 'idle', library: null, error: null,
  load: async () => {
    if (get().status !== 'idle') return;
    set({ status: 'loading' });
    try {
      const [res, extras] = await Promise.all([fetch('/data/library.json'), loadArtistExtras()]);
      if (!res.ok) throw new Error(`library.json: HTTP ${res.status}`);
      set({ status: 'ready', library: normalize(await res.json(), extras) });
    } catch (e) {
      set({ status: 'error', error: String(e) });
    }
  },
}));

export const useLibraryData = () => useLibrary((s) => s.library);
