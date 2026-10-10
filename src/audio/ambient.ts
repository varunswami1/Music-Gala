// Ambient background loop. Owner: Person 1. Fully separate from song playback (see audio/songPlayer.ts).
// Off by default, starts only from a click (autoplay rules), fades in/out, low volume, one Audio element for the whole app.
import { useApp } from '../store/app';

const SRC = '/audio/ambient.mp3';
const LEVEL = 0.25;
let el: HTMLAudioElement | null = null;
let timer: number | undefined;
let wanted = false; // what the user last asked for, so a slow play() cannot flip the state back

function audio() {
  if (el) return el;
  el = new Audio(SRC);
  el.loop = true;
  el.volume = 0;
  el.addEventListener('error', () => {
    wanted = false;
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

const isAudio = (r: Response) => r.ok || r.status === 206 ? (r.headers.get('content-type') ?? '').startsWith('audio') : false;

/** Call once at start: marks ambience unavailable when the file is missing (a dev server answers with index.html, which is not audio). */
export function initAmbient() {
  fetch(SRC, { method: 'HEAD' })
    .then((r) => (r.status === 405 ? fetch(SRC, { headers: { Range: 'bytes=0-0' } }) : r)) // some servers refuse HEAD
    .then((r) => { if (!isAudio(r)) useApp.getState().setAmbientAvailable(false); })
    .catch(() => useApp.getState().setAmbientAvailable(false));
}

/** Must be called from a click (browser autoplay rules). */
export function setAmbient(on: boolean) {
  const s = useApp.getState();
  if (!s.ambientAvailable) return;
  wanted = on;
  const a = audio();
  if (on) {
    a.play()
      .then(() => { if (!wanted) { a.pause(); return; } s.setAmbientOn(true); fade(LEVEL); })
      .catch(() => { if (wanted) { wanted = false; s.setAmbientOn(false); } });
  } else {
    s.setAmbientOn(false);
    fade(0, () => a.pause());
  }
}
