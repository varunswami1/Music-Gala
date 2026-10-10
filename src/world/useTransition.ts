import { useEffect, useRef, useState } from 'react';

/** 'out' = fading to black and pushing forward, 'in' = new room fading in, 'idle' = normal. */
export type Phase = 'idle' | 'out' | 'in';
export const OUT_MS = 240;
export const IN_MS = 460;

/**
 * Delays the switch to a new route until the screen has faded out, so the scene and its HTML panels swap behind black.
 * Returns the path to *show* and the current phase. Reduced motion: switches immediately, no phases.
 * Rapid navigation is safe: the latest route always wins and A→B→A cancels the fade.
 */
export function useTransitionedPath(pathname: string, reduced: boolean) {
  const [shown, setShown] = useState(pathname);
  const [phase, setPhase] = useState<Phase>('idle');
  const shownRef = useRef(pathname);

  useEffect(() => {
    if (pathname === shownRef.current) {
      setPhase((p) => (p === 'out' ? 'in' : p));
      const t = window.setTimeout(() => setPhase((p) => (p === 'in' ? 'idle' : p)), IN_MS);
      return () => window.clearTimeout(t);
    }
    if (reduced) { shownRef.current = pathname; setShown(pathname); setPhase('idle'); return; }
    let t2 = 0;
    setPhase('out');
    const t1 = window.setTimeout(() => {
      shownRef.current = pathname;
      setShown(pathname);
      setPhase('in');
      t2 = window.setTimeout(() => setPhase('idle'), IN_MS);
    }, OUT_MS);
    return () => { window.clearTimeout(t1); window.clearTimeout(t2); };
  }, [pathname, reduced]);

  return { shown, phase };
}
