// Playlist data for the Playlists room. Owner: Person 3.
// The shared Song type (contract) has no playlist membership, so we read `sourcePlaylists` straight from
// /data/library.json here instead of changing the contract. The request is cached once per page load.
import { useEffect, useMemo, useState } from 'react';
import { create } from 'zustand';
import type { Song } from '../../contract/types';
import { useLibraryData } from '../../data/library';

export interface Playlist { id: string; name: string; displayName: string; subtitle: string; songs: Song[] }

/** Friendly names for playlists whose raw names say nothing. Edit this map to rename: key = raw name, lower-case. */
export const PLAYLIST_NAMES: Record<string, string> = {
  'favorite songs': 'Favourite Songs',
  'favorite albums': 'Favourite Albums',
  'liked videos': 'Liked Videos',
};
export function playlistDisplayName(raw: string): string {
  const known = PLAYLIST_NAMES[raw.trim().toLowerCase()];
  if (known) return known;
  const spaced = raw.trim().replace(/([A-Za-z])(\d)/g, '$1 $2').replace(/[_-]+/g, ' ');
  return spaced.replace(/\b([a-z])/g, (c) => c.toUpperCase()) || 'Untitled playlist';
}

let membership: Promise<Map<string, string[]>> | null = null;
function loadMembership(): Promise<Map<string, string[]>> {
  if (!membership) {
    membership = fetch('/data/library.json')
      .then((r) => { if (!r.ok) throw new Error(`library.json: HTTP ${r.status}`); return r.json(); })
      .then((raw: { tracks?: { id?: string; sourcePlaylists?: unknown }[] }) => {
        const m = new Map<string, string[]>();
        for (const t of raw.tracks ?? []) {
          if (t.id && Array.isArray(t.sourcePlaylists)) m.set(t.id, t.sourcePlaylists.filter((x): x is string => typeof x === 'string'));
        }
        return m;
      })
      .catch((e) => { membership = null; throw e; });
  }
  return membership;
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'playlist';

export function usePlaylists(): { status: 'loading' | 'ready' | 'error'; playlists: Playlist[] } {
  const lib = useLibraryData();
  const [m, setM] = useState<Map<string, string[]> | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    loadMembership().then((x) => { if (live) setM(x); }).catch(() => { if (live) setFailed(true); });
    return () => { live = false; };
  }, []);
  const playlists = useMemo<Playlist[]>(() => {
    if (!lib || !m) return [];
    const groups = new Map<string, Song[]>();
    for (const s of lib.songs) for (const name of m.get(s.id) ?? []) {
      const g = groups.get(name); if (g) g.push(s); else groups.set(name, [s]);
    }
    const roomName = new Map<string, string>(lib.rooms.map((r): [string, string] => [r.id, r.displayName]));
    return [...groups.entries()].map(([name, songs]): Playlist => {
      const counts = new Map<string, number>();
      for (const s of songs) counts.set(s.roomId, (counts.get(s.roomId) ?? 0) + 1);
      const [topId, topN] = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? ['', 0];
      const subtitle = `${songs.length} SONGS · ` + (topN / songs.length >= 0.4 ? `MOSTLY ${(roomName.get(topId) ?? 'ONE SCENE').toUpperCase()}` : 'MIXED SCENES');
      const sorted = [...songs].sort((a, b) => Number(!!b.coverUrl) - Number(!!a.coverUrl) || Number(b.isFavourite) - Number(a.isFavourite));
      return { id: slug(name), name, displayName: playlistDisplayName(name), subtitle, songs: sorted };
    }).sort((a, b) => b.songs.length - a.songs.length || a.displayName.localeCompare(b.displayName));
  }, [lib, m]);
  return { status: failed ? 'error' : lib && m ? 'ready' : 'loading', playlists };
}

/** Short, font-safe label for 3D text: drops emoji / non-ASCII (the 3D font lacks them), trims, truncates. */
export function frameLabel(name: string, max = 22): string {
  const t = name.replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, ' ').trim().toUpperCase() || 'PLAYLIST';
  return t.length > max ? t.slice(0, max - 1).trimEnd() + '…' : t;
}

export const PAGE_SIZE = 8; // frames per page (2 rows of 4); the real library has ~40 playlists

/** Which playlist is open and which page of frames is shown. Kept here because the contract has no playlist route (see CHANGELOG). */
interface ViewState { selectedId: string | null; page: number; select: (id: string | null) => void; setPage: (p: number) => void }
export const usePlaylistView = create<ViewState>((set) => ({
  selectedId: null, page: 0,
  select: (selectedId) => set({ selectedId }),
  setPage: (page) => set({ page: Math.max(0, page) }),
}));
