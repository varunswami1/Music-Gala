// Lyrics access point. Owner: Person 5. Only a licensed/authorised source is used. Never scrape, never invent lyrics.
//
// How it works: scripts/fetch_lyrics.py asks a licensed provider (Musixmatch) for each song, using YOUR API key on YOUR machine,
// and stores what the licence returns in public/data/lyrics/<youtubeId>.json (or <songId> when the song has no youtubeId). This function only reads those files, so no key
// ever reaches the browser. A song with no file shows "unavailable", honestly. Free provider tiers often return only a
// snippet: such files carry partial=true and the text below says so.
import type { Song } from '../contract/types';

export type Lyrics =
  | { status: 'ok'; text: string; source: string }
  | { status: 'unavailable'; reason: string };

interface LyricsFile { text?: unknown; source?: unknown; partial?: unknown }

const cache = new Map<string, Lyrics>();
const NO_FILE = 'No licensed lyrics are stored for this song.';

export async function getLyrics(song: Song): Promise<Lyrics> {
  const hit = cache.get(song.id);
  if (hit) return hit;
  const result = await read(song.youtubeId ?? song.id);
  cache.set(song.id, result);
  return result;
}

async function read(id: string): Promise<Lyrics> {
  try {
    const res = await fetch(`/data/lyrics/${encodeURIComponent(id)}.json`);
    // The dev server answers unknown paths with index.html (status 200), so check that this really is JSON.
    if (!res.ok || !(res.headers.get('content-type') ?? '').includes('json')) return { status: 'unavailable', reason: NO_FILE };
    const f = (await res.json()) as LyricsFile;
    const text = typeof f.text === 'string' ? f.text.trim() : '';
    if (!text) return { status: 'unavailable', reason: NO_FILE };
    const source = typeof f.source === 'string' && f.source ? f.source : 'licensed provider';
    const note = f.partial === true ? `\n\n— PARTIAL: only the part the licence allows is shown.\nSOURCE: ${source}` : `\n\nSOURCE: ${source}`;
    return { status: 'ok', text: text + note, source };
  } catch {
    return { status: 'unavailable', reason: 'Lyrics could not be loaded.' };
  }
}
