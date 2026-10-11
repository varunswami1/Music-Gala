// Store that links the 3D card ring (inside the canvas) with the HTML search/nav (over the canvas). Owner: Person 3.
import { create } from 'zustand';
import type { Song } from '../../contract/types';
import type { GroupMode } from './clusters';

export interface ClusterMeta { id: string; label: string; count: number }
const MODES: GroupMode[] = ['artist', 'year', 'all'];

interface RingState {
  mode: GroupMode;
  index: number;                 // front layer (cluster) index
  clusters: ClusterMeta[];
  pool: Song[];                  // songs of the ring that is open right now; empty when no ring is open (search scope)
  focusId: string | null;        // ask the open ring to bring this song to the front
  pendingFocus: string | null;   // same, but survives a room change (global search -> room)
  pinnedId: string | null;       // the song currently shown "pulled out" in front of the viewer
  setClusters: (c: ClusterMeta[]) => void;
  setPool: (s: Song[]) => void;
  cycleMode: () => void;
  requestFocus: (id: string) => void;
  setPending: (id: string | null) => void;
  reset: () => void;
}

export const useRing = create<RingState>((set, get) => ({
  mode: 'artist', index: 0, clusters: [], pool: [], focusId: null, pendingFocus: null, pinnedId: null,
  setClusters: (clusters) => set((s) => ({ clusters, index: Math.min(s.index, Math.max(0, clusters.length - 1)) })),
  setPool: (pool) => set({ pool }),
  cycleMode: () => set({ mode: MODES[(MODES.indexOf(get().mode) + 1) % MODES.length], index: 0 }),
  requestFocus: (id) => set({ focusId: id }),
  setPending: (pendingFocus) => set({ pendingFocus }),
  reset: () => set({ mode: 'artist', index: 0, clusters: [], pool: [], focusId: null, pinnedId: null }), // keeps pendingFocus on purpose
}));
