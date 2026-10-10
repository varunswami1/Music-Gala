// Respect prefers-reduced-motion for the decorative animation in Lobby and Studio. Owner: Person 2.
import { useEffect, useState } from 'react';

const QUERY = '(prefers-reduced-motion: reduce)';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(() => typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia(QUERY).matches);
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia(QUERY);
    const on = () => setReduced(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return reduced;
}
