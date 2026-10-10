// Song playback. Owner: Person 4.
// Official YouTube IFrame Player API only (no audio extraction). One player at a time:
// creating a new player destroys the previous one. Independent of ambient audio (audio/ambient.ts),
// except that ambience is faded out when a song starts, so the two never play together.
import { useCallback, useEffect, useRef, useState } from 'react';
import { create } from 'zustand';
import { useApp } from '../store/app';
import { setAmbient } from './ambient';

export type PlayerStatus =
  | 'idle'        // nothing loaded
  | 'loading'     // YouTube API / player starting
  | 'ready'       // cued, not started
  | 'playing'
  | 'paused'
  | 'buffering'
  | 'ended'
  | 'unavailable' // no video linked, or the YouTube API could not be loaded
  | 'error';      // YouTube refused this video (embedding disabled, removed, private...)

export interface PlayerState {
  status: PlayerStatus;
  currentTime: number; // seconds
  duration: number;    // seconds, 0 until known
  volume: number;      // 0..100
  message: string | null; // human-readable reason for 'unavailable' / 'error'
}

export interface SongPlayer {
  load(youtubeId: string): void;
  play(): void;
  pause(): void;
  seek(seconds: number): void;
  setVolume(v: number): void; // 0..100
  destroy(): void;
  getState(): PlayerState;
  subscribe(fn: (s: PlayerState) => void): () => void;
}

/** True when the transport controls can act (the player exists and the video is usable). */
export const canControl = (s: PlayerStatus) => s === 'ready' || s === 'playing' || s === 'paused' || s === 'buffering' || s === 'ended';

// ---- minimal typings for the bits of the YouTube IFrame API we use -------------------------------------------
interface YTPlayer {
  cueVideoById(id: string): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(v: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}
interface YTNamespace {
  Player: new (el: HTMLElement, opts: {
    width: string; height: string;
    playerVars: Record<string, string | number>;
    events: { onReady: () => void; onStateChange: (e: { data: number }) => void; onError: (e: { data: number }) => void };
  }) => YTPlayer;
}
declare global {
  interface Window { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void }
}

const INITIAL: PlayerState = { status: 'idle', currentTime: 0, duration: 0, volume: 70, message: null };

/** Mirror of the active player's state so other components (e.g. the 3D cover) can react to it. */
export const usePlayback = create<PlayerState>(() => INITIAL);

// ---- volume is remembered for the session ----------------------------------------------------------------------
const readVolume = () => {
  try { const v = Number(sessionStorage.getItem('songVolume')); return Number.isFinite(v) && v >= 0 && v <= 100 && sessionStorage.getItem('songVolume') !== null ? v : INITIAL.volume; }
  catch { return INITIAL.volume; }
};
const writeVolume = (v: number) => { try { sessionStorage.setItem('songVolume', String(v)); } catch { /* storage unavailable */ } };

// ---- loading the official API script (once) --------------------------------------------------------------------
let apiPromise: Promise<YTNamespace> | null = null;
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (apiPromise) return apiPromise;
  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const fail = (why: string) => { apiPromise = null; script.remove(); reject(new Error(why)); };
    const previous = window.onYouTubeIframeAPIReady;
    const timer = window.setTimeout(() => fail('timeout'), 12000);
    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timer);
      previous?.();
      if (window.YT?.Player) resolve(window.YT); else fail('api missing');
    };
    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    script.async = true;
    script.onerror = () => { window.clearTimeout(timer); fail('blocked'); };
    document.head.appendChild(script);
  });
  return apiPromise;
}

const ERROR_TEXT: Record<number, string> = {
  2: 'THIS VIDEO LINK IS INVALID',
  5: 'THE PLAYER HIT AN ERROR ON THIS VIDEO',
  100: 'VIDEO REMOVED OR PRIVATE',
  101: 'THE OWNER DISABLED EMBEDDED PLAYBACK',
  150: 'THE OWNER DISABLED EMBEDDED PLAYBACK',
};

let active: SongPlayer | null = null;

/** Create the (single) player inside `host`. Any previous player is destroyed first. Nothing autoplays. */
export function createSongPlayer(host: HTMLElement): SongPlayer {
  active?.destroy();

  let state: PlayerState = { ...INITIAL, status: 'loading', volume: readVolume() };
  const listeners = new Set<(s: PlayerState) => void>();
  let yt: YTPlayer | null = null;
  let ready = false;
  let dead = false;
  let pendingId: string | null = null;
  let poll: number | undefined;

  const emit = (patch: Partial<PlayerState>) => {
    if (dead) return;
    state = { ...state, ...patch };
    usePlayback.setState(state, true);
    listeners.forEach((fn) => fn(state));
  };

  const readClock = () => {
    if (!yt || !ready || dead) return;
    try {
      const t = yt.getCurrentTime();
      const d = yt.getDuration();
      const currentTime = Number.isFinite(t) ? t : 0;
      const duration = Number.isFinite(d) ? d : 0;
      if (Math.abs(currentTime - state.currentTime) > 0.2 || duration !== state.duration) emit({ currentTime, duration });
    } catch { /* player is being torn down */ }
  };

  const cue = (id: string) => {
    if (!yt) return;
    emit({ status: 'ready', currentTime: 0, duration: 0, message: null });
    yt.cueVideoById(id);
  };

  const mount = document.createElement('div'); // YouTube replaces this element with its iframe
  host.replaceChildren(mount);
  usePlayback.setState(state, true);

  loadYouTubeApi()
    .then((YT) => {
      if (dead) return;
      yt = new YT.Player(mount, {
        width: '100%', height: '100%',
        playerVars: { controls: 0, rel: 0, modestbranding: 1, playsinline: 1, disablekb: 1, fs: 0, origin: window.location.origin },
        events: {
          onReady: () => {
            if (dead || !yt) return;
            ready = true;
            yt.setVolume(state.volume);
            if (pendingId) cue(pendingId);
          },
          onStateChange: (e) => {
            if (dead) return;
            switch (e.data) {
              case 1: // playing
                if (useApp.getState().ambientOn) setAmbient(false); // never two sounds at once
                emit({ status: 'playing', message: null });
                break;
              case 2: emit({ status: 'paused' }); readClock(); break;
              case 3: emit({ status: 'buffering' }); break;
              case 0: emit({ status: 'ended' }); readClock(); break;
              case 5: emit({ status: 'ready' }); break;
              default: break; // -1 unstarted: keep the current status
            }
          },
          onError: (e) => emit({ status: 'error', message: ERROR_TEXT[e.data] ?? 'THIS VIDEO CANNOT BE PLAYED HERE' }),
        },
      });
    })
    .catch(() => emit({ status: 'unavailable', message: 'COULD NOT REACH YOUTUBE (OFFLINE OR BLOCKED)' }));

  poll = window.setInterval(() => { if (state.status === 'playing' || state.status === 'buffering') readClock(); }, 250);

  const player: SongPlayer = {
    load(youtubeId) {
      if (dead) return;
      pendingId = youtubeId;
      if (ready) cue(youtubeId);
    },
    play() {
      if (dead || !ready || !yt || !canControl(state.status)) return;
      if (state.status === 'ended') yt.seekTo(0, true);
      yt.playVideo();
    },
    pause() { if (!dead && ready && yt) yt.pauseVideo(); },
    seek(seconds) {
      if (dead || !ready || !yt) return;
      const to = Math.max(0, state.duration ? Math.min(seconds, state.duration) : seconds);
      yt.seekTo(to, true);
      emit({ currentTime: to });
    },
    setVolume(v) {
      const vol = Math.round(Math.max(0, Math.min(100, v)));
      writeVolume(vol);
      if (ready && yt && !dead) yt.setVolume(vol);
      emit({ volume: vol });
    },
    destroy() {
      if (dead) return;
      window.clearInterval(poll);
      try { yt?.destroy(); } catch { /* already gone */ }
      yt = null; ready = false;
      host.replaceChildren();
      dead = true;
      listeners.clear();
      if (active === player) { active = null; usePlayback.setState(INITIAL, true); }
    },
    getState: () => state,
    subscribe(fn) { listeners.add(fn); fn(state); return () => { listeners.delete(fn); }; },
  };
  active = player;
  return player;
}

/** Play/pause whatever is active (used by the 3D cover and the Space key). No-op when nothing can play. */
export function toggleActivePlayback() {
  if (!active) return;
  const s = active.getState();
  if (!canControl(s.status)) return;
  if (s.status === 'playing' || s.status === 'buffering') active.pause(); else active.play();
}

/**
 * React binding. Attach `hostRef` to an empty <div>; the player lives in it for as long as the component is mounted
 * and is destroyed on unmount or when `youtubeId` changes (leaving a song room stops playback).
 */
export function useSongPlayer(youtubeId: string | null) {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<SongPlayer | null>(null);
  const [state, setState] = useState<PlayerState>(INITIAL);

  useEffect(() => {
    const host = hostRef.current;
    if (!host || !youtubeId) {
      setState({ ...INITIAL, status: 'unavailable', message: 'NO VIDEO IS LINKED TO THIS SONG', volume: readVolume() });
      return;
    }
    const p = createSongPlayer(host);
    playerRef.current = p;
    const off = p.subscribe(setState);
    p.load(youtubeId);
    return () => { off(); p.destroy(); if (playerRef.current === p) playerRef.current = null; };
  }, [youtubeId]);

  const play = useCallback(() => playerRef.current?.play(), []);
  const pause = useCallback(() => playerRef.current?.pause(), []);
  const seek = useCallback((s: number) => playerRef.current?.seek(s), []);
  const setVolume = useCallback((v: number) => playerRef.current?.setVolume(v), []);
  const toggle = useCallback(() => toggleActivePlayback(), []);
  return { hostRef, state, play, pause, toggle, seek, setVolume };
}
