import { Link } from 'react-router-dom';
import { useApp } from '../store/app';
import { useLibrary } from '../data/library';
import type { Phase } from '../world/useTransition';

/** Black fade between rooms: quick fade out ('out'), slower fade in. Driven by useTransitionedPath. */
export function Fade({ phase }: { phase: Phase }) {
  return <div className={'fade' + (phase === 'out' ? ' out' : '')} aria-hidden="true" />;
}

export function HintBar() {
  const hint = useApp((s) => s.hint);
  return <div className="hintbar" aria-live="polite">{hint}</div>;
}

/** Shows which 3D object has keyboard focus (the cursor label does this for the mouse). */
export function FocusLabel() {
  const label = useApp((s) => s.focusLabel);
  if (!label) return null;
  return <div className="focuslabel" aria-hidden="true">ENTER ↵ {label}</div>;
}

export function LoadState() {
  const status = useLibrary((s) => s.status);
  const error = useLibrary((s) => s.error);
  if (status === 'ready') return null;
  return (
    <div className="status" role="status">
      {status === 'error' ? `COULD NOT LOAD LIBRARY (${error}). PUT library.json IN public/data/` : 'LOADING LIBRARY…'}
    </div>
  );
}

export function NotFound() {
  return (
    <div className="panel left">
      <div className="eyebrow">404</div>
      <h1>Nothing here</h1>
      <p className="calm">This address does not lead to a room. It may have moved, or the link is mistyped.</p>
      <Link className="btn" to="/">BACK TO LOBBY</Link>
    </div>
  );
}
