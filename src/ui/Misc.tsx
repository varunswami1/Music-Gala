import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../store/app';
import { tx } from '../world/transition';
import { useLibrary } from '../data/library';

export function Fade({ pathname }: { pathname: string }) {
  const [on, setOn] = useState(false);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (tx.phase !== 'idle') return;        // the door transition already covers the screen
    setOn(true);
    const t = window.setTimeout(() => setOn(false), 350);
    return () => window.clearTimeout(t);
  }, [pathname]);
  return <div className={'fade' + (on ? ' on' : '')} />;
}

export function HintBar() {
  const hint = useApp((s) => s.hint);
  return <div className="hintbar" aria-live="polite">{hint}</div>;
}

export function LoadState() {
  const status = useLibrary((s) => s.status);
  const error = useLibrary((s) => s.error);
  if (status === 'ready') return null;
  return (
    <div className="status">
      {status === 'error' ? `COULD NOT LOAD LIBRARY (${error}). PUT library.json IN public/data/` : 'LOADING LIBRARY…'}
    </div>
  );
}

export function NotFound() {
  return (
    <div className="panel left">
      <div className="eyebrow">404</div>
      <h1>No such room</h1>
      <Link className="btn" to="/">BACK TO LOBBY</Link>
    </div>
  );
}
