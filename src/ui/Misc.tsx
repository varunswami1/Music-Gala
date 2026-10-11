import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store/app';
import { useLibrary } from '../data/library';
import type { Phase } from '../world/useTransition';

/** Black fade between rooms: quick fade out ('out'), slower fade in. Driven by useTransitionedPath. */
export function Fade({ phase }: { phase: Phase }) {
  return <div className={'fade' + (phase === 'out' ? ' out' : '')} aria-hidden="true" />;
}

const GLYPHS = '<\\/|-_';
/** Bottom hint line. Shows the hovered object's name while the pointer is over one. Text scrambles in briefly, like the reference. */
export function HintBar() {
  const hint = useApp((s) => s.hint);
  const hover = useApp((s) => s.hoverName);
  const reduced = useApp((s) => s.reducedMotion);
  const full = hover ? `${hover.toUpperCase()} · CLICK / ENTER TO OPEN` : hint;
  const [shown, setShown] = useState(full);
  useEffect(() => {
    if (reduced || !full) { setShown(full); return; }
    let f = 0, raf = 0;
    const step = () => {
      f += 1;
      const keep = Math.floor((f / 14) * full.length);
      setShown(full.slice(0, keep) + Array.from(full.slice(keep), (c) => (c === ' ' || c === '·' ? c : GLYPHS[Math.floor(Math.random() * GLYPHS.length)])).join(''));
      if (keep < full.length) raf = requestAnimationFrame(step); else setShown(full);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [full, reduced]);
  return <div className="hintbar" aria-live="polite" aria-label={full}>{shown}</div>;
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
