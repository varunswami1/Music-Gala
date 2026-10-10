// Optional artist enrichment (bios, portraits). Owner: Person 5.
// Source file: public/data/artists.json, produced by scripts/build_artists.py. Every field is optional; the app works without the file.
import type { Artist } from '../contract/types';

export interface ArtistExtra {
  bio?: string | null;
  bioSource?: string | null;      // e.g. "Wikipedia (CC BY-SA 4.0)"; appended to the bio so credit is always visible
  imageUrl?: string | null;       // local (/artists/<id>.jpg) or remote; null when none was found
  genres?: string[];
  origin?: string | null;
  activeYears?: string | null;
}
export type ArtistExtras = Record<string, ArtistExtra>;

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null);

/** Fetches artists.json. Never throws: a missing or broken file simply means "no bios yet". */
export async function loadArtistExtras(): Promise<ArtistExtras> {
  try {
    const res = await fetch('/data/artists.json');
    if (!res.ok) return {};
    const raw = await res.json();
    return raw && typeof raw === 'object' && !Array.isArray(raw) ? (raw as ArtistExtras) : {};
  } catch {
    return {};
  }
}

/** Returns the artist with any extra fields applied. Unknown or malformed entries are ignored. */
export function applyExtra(artist: Artist, extra: ArtistExtra | undefined): Artist {
  if (!extra) return artist;
  const bio = str(extra.bio);
  const source = str(extra.bioSource);
  return {
    ...artist,
    bio: bio ? (source ? `${bio}\n\nSOURCE: ${source}` : bio) : null,
    imageUrl: str(extra.imageUrl),
    genres: Array.isArray(extra.genres) ? extra.genres.filter((g) => typeof g === 'string').slice(0, 6) : undefined,
    origin: str(extra.origin),
    activeYears: str(extra.activeYears),
  };
}
