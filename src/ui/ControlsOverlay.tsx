import { setAmbient } from '../audio/ambient';
import { useApp } from '../store/app';

/** Bottom-right controls. Only real, working controls belong here. Owner: Person 1. */
export function ControlsOverlay() {
  const on = useApp((s) => s.ambientOn);
  const available = useApp((s) => s.ambientAvailable);
  const setGuide = useApp((s) => s.setGuideOpen);
  return (
    <div className="controls">
      <button onClick={() => setGuide(true)}>CONTROLS</button>
      <button disabled={!available} aria-pressed={available ? on : undefined} onClick={() => setAmbient(!on)} title={available ? '' : 'Add public/audio/ambient.mp3 to enable'}>
        {available ? (on ? 'SOUND ON' : 'SOUND OFF') : 'SOUND N/A'}
      </button>
    </div>
  );
}
