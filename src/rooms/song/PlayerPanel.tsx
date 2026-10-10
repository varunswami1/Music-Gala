// Embedded YouTube playback with play/pause, progress and volume. Owner: Person 4.
// The official embed stays visible (we never hide or extract it). Nothing autoplays; status text is always honest.
import { useEffect, useState } from 'react';
import { canControl, useSongPlayer } from '../../audio/songPlayer';

const fmt = (s: number) => { const t = Math.max(0, Math.floor(s)); return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`; };
const STATUS: Record<string, string> = { idle: '', loading: 'STARTING PLAYER…', ready: 'READY', playing: 'PLAYING', paused: 'PAUSED', buffering: 'BUFFERING…', ended: 'ENDED' };

export function PlayerPanel({ youtubeId }: { youtubeId: string | null }) {
  const { hostRef, state, toggle, seek, setVolume } = useSongPlayer(youtubeId);
  const [scrub, setScrub] = useState<number | null>(null);
  const usable = canControl(state.status);
  const playing = state.status === 'playing' || state.status === 'buffering';

  // Space = play/pause, but never while typing, on a control, or inside the lyrics / lists.
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(t.tagName) || t.closest('.lyrics, .list, .bio'))) return;
      if (!usable) return;
      e.preventDefault();
      toggle();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [usable, toggle]);

  const message = state.status === 'unavailable' || state.status === 'error' ? state.message : null;
  const commit = () => { if (scrub !== null) { seek(scrub); setScrub(null); } };
  return (
    <div className="pl" aria-label="Player">
      <div className="pl-video">
        <div ref={hostRef} className="pl-host" />
        {message && (
          <div className="pl-msg" role="status">
            <span>{message}</span>
            {youtubeId && <a href={`https://www.youtube.com/watch?v=${encodeURIComponent(youtubeId)}`} target="_blank" rel="noopener noreferrer">OPEN ON YOUTUBE ↗</a>}
          </div>
        )}
      </div>
      <div className="pl-controls">
        <button className="pl-btn" disabled={!usable} onClick={toggle} aria-label={playing ? 'Pause' : 'Play'}>
          {state.status === 'loading' ? '…' : playing ? 'PAUSE' : state.status === 'ended' ? 'REPLAY' : 'PLAY'}
        </button>
        <span className="pl-time">{fmt(scrub ?? state.currentTime)} / {state.duration ? fmt(state.duration) : '–:––'}</span>
      </div>
      <input
        className="pl-range" type="range" aria-label="Progress" min={0} max={Math.max(1, Math.floor(state.duration))} step={1}
        disabled={!usable || !state.duration} value={Math.floor(scrub ?? state.currentTime)}
        onChange={(e) => setScrub(Number(e.target.value))} onPointerUp={commit} onKeyUp={commit} onBlur={commit}
      />
      <label className="pl-vol">VOL
        <input className="pl-range" type="range" aria-label="Volume" min={0} max={100} step={1} value={state.volume} onChange={(e) => setVolume(Number(e.target.value))} />
      </label>
      <div className="pl-status" aria-live="polite">{message ? '' : STATUS[state.status]}</div>
    </div>
  );
}
