// Language labels. Owner: Person 5.
// Rule from TEAM.md: LANGUAGE = a filter, SCENE = a room. A song always lives in exactly one scene room; its language is
// a separate, derived label that people can filter by. Nothing here changes roomId.
import type { Library, Song } from '../contract/types';

export interface Language { id: string; label: string }

export const LANGUAGES: Language[] = [
  { id: 'hindi', label: 'Hindi' },
  { id: 'punjabi', label: 'Punjabi' },
  { id: 'english', label: 'English' },
  { id: 'regional', label: 'Regional' },
  { id: 'other', label: 'Other' },
];

// Last.fm style tags, lower-case. Extend as the enrichment produces more tags.
const TAG_LANG: [RegExp, string][] = [
  [/\bpunjabi\b|\bbhangra\b/, 'punjabi'],
  [/\bhindi\b|\bbollywood\b|\burdu\b/, 'hindi'],
  [/\bharyanvi\b|\brajasthani\b|\bbhojpuri\b|\btamil\b|\btelugu\b|\bmalayalam\b|\bkannada\b|\bbengali\b|\bmarathi\b|\bgujarati\b|\bdevotional\b|\bbhajan\b|\bfolk\b/, 'regional'],
  [/\benglish\b/, 'english'],
];

/** Script of the title is the strongest hint we have without lyrics: Gurmukhi is Punjabi, Devanagari is Hindi. */
function byScript(text: string): string | null {
  if (/[\u0A00-\u0A7F]/.test(text)) return 'punjabi';
  if (/[\u0900-\u097F]/.test(text)) return 'hindi';
  if (/[\u0B80-\u0BFF\u0C00-\u0C7F\u0D00-\u0D7F\u0C80-\u0CFF\u0980-\u09FF\u0A80-\u0AFF]/.test(text)) return 'regional';
  return null;
}

/** Best-effort language of a song: its own tags, then the title's script, then the scene room as a fallback. */
export function languageOf(song: Song): string {
  const tags = [...song.tags, ...song.genreTags].join(' ').toLowerCase();
  for (const [re, lang] of TAG_LANG) if (re.test(tags)) return lang;
  const script = byScript(`${song.title} ${song.artistNames.join(' ')}`);
  if (script) return script;
  switch (song.roomId) {
    case 'hindi_film': return 'hindi';
    case 'punjabi': return 'punjabi';
    case 'english': return 'english';
    case 'folk_regional': return 'regional';
    default: return 'other'; // desi hip-hop, indie pop and the Cellar can be in any language
  }
}

export function languageCounts(lib: Library, songs: Song[] = lib.songs): Map<string, number> {
  const m = new Map<string, number>();
  for (const s of songs) { const l = languageOf(s); m.set(l, (m.get(l) ?? 0) + 1); }
  return m;
}
