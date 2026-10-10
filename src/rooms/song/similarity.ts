// "Similar songs from your library": a transparent scoring rule, no AI, no network. Owner: Person 4.
import type { Song } from '../../contract/types';

const tagsOf = (s: Song) => new Set([...s.tags, ...s.genreTags].map((t) => t.toLowerCase()));

export function similarityScore(a: Song, b: Song): number {
  if (a.id === b.id) return -1;
  let score = 0;
  for (const id of a.artistIds) if (b.artistIds.includes(id)) score += 6;
  const ta = tagsOf(a);
  let shared = 0;
  for (const t of tagsOf(b)) if (ta.has(t)) shared++;
  score += Math.min(shared, 3) * 2;
  if (a.roomId === b.roomId) score += 1.5;
  if (a.wing && a.wing === b.wing) score += 0.5;
  if (a.year && b.year) { const d = Math.abs(a.year - b.year); score += d <= 2 ? 1 : d <= 5 ? 0.5 : 0; }
  if (b.coverUrl) score += 0.25;
  if (b.isFavourite) score += 0.25;
  return score;
}

export function rankSimilar(song: Song, all: Song[], limit = 12): Song[] {
  return all
    .map((s) => ({ s, score: similarityScore(song, s) }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score || x.s.title.localeCompare(y.s.title) || x.s.id.localeCompare(y.s.id))
    .slice(0, limit)
    .map((x) => x.s);
}
