// Ambient background loop. Owner: Person 1. Fully separate from song playback (see audio/songPlayer.ts).
import { create } from 'zustand';
import { useApp } from '../store/app';

/** The ambient options the visitor can choose from (the SOUND picker in the bottom-right controls). */
export const AMBIENT_TRACKS = [
  { id: 'hall', label: 'DEEP HALL', src: '/audio/ambient.mp3' },
  { id: 'rain', label: 'NIGHT RAIN', src: '/audio/ambient-rain.mp3' },
  { id: 'glass', label: 'GLASS PADS', src: '/audio/ambient-glass.mp3' },
] as const;
export type AmbientTrackId = (typeof AMBIENT_TRACKS)[number]['id'];
const KEY = 'ambientTrack';
const find = (id: string) => AMBIENT_TRACKS.find((t) => t.id === id) ?? AMBIENT_TRACKS[0];
const saved = (): AmbientTrackId => { try { return find(localStorage.getItem(KEY) ?? '').id; } catch { return 'hall'; } };
/** Which option is selected (remembered between visits). */
export const useAmbientTrack = create<{ id: AmbientTrackId }>(() => ({ id: saved() }));

const SRC = AMBIENT_TRACKS[0].src; // the default track doubles as the "is audio available" probe
const LEVEL = 0.25;
let el: HTMLAudioElement | null = null;
let timer: number | undefined;

function audio() {
  if (el) return el;
  el = new Audio(find(useAmbientTrack.getState().id).src);
  el.loop = true;
  el.volume = 0;
  el.addEventListener('error', () => {
    if (useAmbientTrack.getState().id !== 'hall') { selectAmbientTrack('hall'); return; } // a missing extra track falls back to the default
    useApp.getState().setAmbientAvailable(false);
    useApp.getState().setAmbientOn(false);
  });
  return el;
}

function fade(to: number, done?: () => void) {
  const a = audio();
  window.clearInterval(timer);
  timer = window.setInterval(() => {
    const d = to - a.volume;
    if (Math.abs(d) < 0.02) { a.volume = to; window.clearInterval(timer); done?.(); }
    else a.volume = Math.max(0, Math.min(1, a.volume + Math.sign(d) * 0.02));
  }, 50);
}

/** Call once at start: marks ambience unavailable when the file is missing. */
export function initAmbient() {
  fetch(SRC, { method: 'HEAD' })
    .then((r) => { if (!r.ok || !(r.headers.get('content-type') ?? '').startsWith('audio')) useApp.getState().setAmbientAvailable(false); })
    .catch(() => useApp.getState().setAmbientAvailable(false));
}

/** Must be called from a click (browser autoplay rules). */
export function setAmbient(on: boolean) {
  const s = useApp.getState();
  if (!s.ambientAvailable) return;
  const a = audio();
  if (on) a.play().then(() => { s.setAmbientOn(true); fade(LEVEL); }).catch(() => s.setAmbientOn(false));
  else { s.setAmbientOn(false); fade(0, () => a.pause()); }
}

/** Choose an ambient option. Must be called from a click: it also starts the sound so the choice can be heard. */
export function selectAmbientTrack(id: AmbientTrackId) {
  const track = find(id);
  try { localStorage.setItem(KEY, track.id); } catch { /* storage unavailable */ }
  useAmbientTrack.setState({ id: track.id });
  const s = useApp.getState();
  if (!el) { if (s.ambientAvailable) setAmbient(true); return; }
  const a = el;
  const swap = () => {
    a.src = track.src;
    a.play().then(() => { useApp.getState().setAmbientOn(true); fade(LEVEL); }).catch(() => useApp.getState().setAmbientOn(false));
  };
  if (s.ambientOn) fade(0, swap); else { a.volume = 0; swap(); }
}
