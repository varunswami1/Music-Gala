/// <reference types="vite/client" />
// Optional link to Person 5's recommendation service. Owner: Person 4.
//
// PROPOSED CONTRACT (needs Person 5's agreement): a file `src/data/recommend.ts` exporting
//   export interface Recommendation { title: string; artistName: string; reason: string; inLibrary: boolean;
//                                      songId?: string; youtubeId?: string | null; coverUrl?: string | null }
//   export function getRecommendations(song: Song): Promise<Recommendation[]>
// Until that file exists the NEW tab says so honestly. import.meta.glob returns nothing for a missing file,
// so nothing breaks (and nothing is invented) before Person 5 delivers.
import { useEffect, useState } from 'react';
import type { Song } from '../../contract/types';

export interface Recommendation {
  title: string; artistName: string; reason: string; inLibrary: boolean;
  songId?: string; youtubeId?: string | null; coverUrl?: string | null;
}
type Mod = { getRecommendations?: (song: Song) => Promise<Recommendation[]> };
const found = import.meta.glob<Mod>('../../data/recommend.ts');

export type RecState =
  | { status: 'loading' }
  | { status: 'ok'; items: Recommendation[] }
  | { status: 'unavailable'; reason: string };

export function useRecommendations(song: Song | undefined, enabled: boolean): RecState {
  const [state, setState] = useState<RecState>({ status: 'loading' });
  useEffect(() => {
    let live = true;
    if (!song || !enabled) return;
    const load = Object.values(found)[0];
    if (!load) { setState({ status: 'unavailable', reason: 'NEW-SONG RECOMMENDATIONS ARE NOT CONNECTED YET' }); return; }
    setState({ status: 'loading' });
    load()
      .then((m) => (m.getRecommendations ? m.getRecommendations(song) : Promise.reject(new Error('missing export'))))
      .then((items) => { if (live) setState({ status: 'ok', items }); })
      .catch(() => { if (live) setState({ status: 'unavailable', reason: 'RECOMMENDATIONS COULD NOT BE LOADED' }); });
    return () => { live = false; };
  }, [song, enabled]);
  return state;
}
