// Global UI state. Owner: Person 1. Selected song/artist are NOT stored here: they come from the URL.
import { useEffect } from 'react';
import { create } from 'zustand';

const read = (k: string) => { try { return sessionStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { sessionStorage.setItem(k, v); } catch { /* storage unavailable */ } };
const matches = (q: string) => typeof window !== 'undefined' && typeof window.matchMedia === 'function' && window.matchMedia(q).matches;

/** 'low' turns off the mirror floor and halves particles. Starts low on touch devices; the FPS guard can also lower it. */
export type Quality = 'high' | 'low';

interface AppState {
  go: (path: string) => void;            // navigation usable from inside the 3D canvas
  setGo: (fn: (path: string) => void) => void;
  cursorLabel: string;                    // text next to the custom cursor, '' = idle
  setCursorLabel: (s: string) => void;
  hint: string;                           // bottom-centre hint line, set per room
  setHint: (s: string) => void;
  focusLabel: string;                     // keyboard-focused 3D object, shown above the hint line ('' = none)
  setFocusLabel: (s: string) => void;
  guideOpen: boolean;
  setGuideOpen: (b: boolean) => void;
  ambientOn: boolean;
  setAmbientOn: (b: boolean) => void;
  ambientAvailable: boolean;
  setAmbientAvailable: (b: boolean) => void;
  lastSongId: string | null;
  setLastSongId: (id: string) => void;
  reducedMotion: boolean;                 // mirrors prefers-reduced-motion (kept live by useSyncReducedMotion)
  setReducedMotion: (b: boolean) => void;
  quality: Quality;
  setQuality: (q: Quality) => void;
}

export const useApp = create<AppState>((set) => ({
  go: () => {},
  setGo: (go) => set({ go }),
  cursorLabel: '',
  setCursorLabel: (cursorLabel) => set({ cursorLabel }),
  hint: '',
  setHint: (hint) => set({ hint }),
  focusLabel: '',
  setFocusLabel: (focusLabel) => set({ focusLabel }),
  guideOpen: read('guideSeen') !== '1',
  setGuideOpen: (guideOpen) => { if (!guideOpen) write('guideSeen', '1'); set({ guideOpen }); },
  ambientOn: false,
  setAmbientOn: (ambientOn) => set({ ambientOn }),
  ambientAvailable: true,
  setAmbientAvailable: (ambientAvailable) => set({ ambientAvailable }),
  lastSongId: null,
  setLastSongId: (lastSongId) => set({ lastSongId }),
  reducedMotion: matches('(prefers-reduced-motion: reduce)'),
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  quality: matches('(pointer: coarse)') ? 'low' : 'high',
  setQuality: (quality) => set({ quality }),
}));

/** Call inside a room to show a hint line while it is open. */
export function useHint(text: string) {
  const setHint = useApp((s) => s.setHint);
  useEffect(() => { setHint(text); return () => setHint(''); }, [text, setHint]);
}

/** True when the user asked the OS for less motion. Rooms with their own animation should check this. */
export const useReducedMotion = () => useApp((s) => s.reducedMotion);

/** Mounted once by App: keeps `reducedMotion` in sync with the OS setting. */
export function useSyncReducedMotion() {
  const set = useApp((s) => s.setReducedMotion);
  useEffect(() => {
    const m = window.matchMedia('(prefers-reduced-motion: reduce)');
    const apply = () => set(m.matches);
    apply();
    m.addEventListener('change', apply);
    return () => m.removeEventListener('change', apply);
  }, [set]);
}
