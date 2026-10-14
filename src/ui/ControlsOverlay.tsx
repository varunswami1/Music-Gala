import { useEffect, useState } from 'react';
import { AMBIENT_TRACKS, selectAmbientTrack, setAmbient, useAmbientTrack } from '../audio/ambient';
import { useApp } from '../store/app';
import './soundPicker.css';

/** Bottom-right controls. Only real, working controls belong here. Owner: Person 1 (sound picker added at the owner's request). */
export function ControlsOverlay() {
  const on = useApp((s) => s.ambientOn);
  const available = useApp((s) => s.ambientAvailable);
  const setGuide = useApp((s) => s.setGuideOpen);
  const track = useAmbientTrack((s) => s.id);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open]);
  return (
    <div className="controls">
      <button onClick={() => setGuide(true)}>CONTROLS</button>
      {open && available && (
        <div className="sound-picker" role="group" aria-label="Ambient sound">
          {AMBIENT_TRACKS.map((t) => (
            <button key={t.id} aria-pressed={t.id === track && on} onClick={() => { selectAmbientTrack(t.id); setOpen(false); }}>
              {t.id === track && on ? '● ' : ''}{t.label}
            </button>
          ))}
        </div>
      )}
      <span className="sound-row">
        {available && <button aria-expanded={open} onClick={() => setOpen((v) => !v)}>CHOOSE SOUND</button>}
        <button disabled={!available} onClick={() => setAmbient(!on)} title={available ? '' : 'Add public/audio/ambient.mp3 to enable'}>
          {available ? (on ? 'SOUND ON' : 'SOUND OFF') : 'SOUND N/A'}
        </button>
      </span>
    </div>
  );
}
