// Small store that links the 3D card ring (inside the canvas) with its HTML controls (over the canvas).
// Lives in the heaven folder so we never touch Person 1's global store. Owner: Person 3.
import { create } from 'zustand';
import type { GroupMode } from './clusters';

export interface ClusterMeta { id: string; label: string; count: number }
interface RingState {
  mode: GroupMode;
  index: number;
  clusters: ClusterMeta[];
  setMode: (m: GroupMode) => void;
  setIndex: (i: number) => void;
  setClusters: (c: ClusterMeta[]) => void;
  reset: () => void;
}

export const useRing = create<RingState>((set, get) => ({
  mode: 'artist', index: 0, clusters: [],
  setMode: (mode) => set({ mode, index: 0 }),
  setIndex: (i) => set({ index: Math.max(0, Math.min(Math.max(0, get().clusters.length - 1), i)) }),
  setClusters: (clusters) => set((s) => ({ clusters, index: Math.min(s.index, Math.max(0, clusters.length - 1)) })),
  reset: () => set({ mode: 'artist', index: 0, clusters: [] }),
}));
