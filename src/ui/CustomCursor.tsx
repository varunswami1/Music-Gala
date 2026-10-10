import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store/app';

/** Bright dot + ring + contextual label. Only on devices with a precise pointer. Owner: Person 1. */
export function CustomCursor() {
  const label = useApp((s) => s.cursorLabel);
  const ref = useRef<HTMLDivElement>(null);
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(pointer: fine)');
    const apply = () => { setFine(m.matches); document.body.classList.toggle('no-cursor', m.matches); };
    apply();
    m.addEventListener('change', apply);
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      if (ref.current) { ref.current.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; ref.current.style.opacity = '1'; }
    };
    const leave = () => { if (ref.current) ref.current.style.opacity = '0'; };
    window.addEventListener('pointermove', move);
    document.documentElement.addEventListener('pointerleave', leave);
    return () => {
      m.removeEventListener('change', apply);
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
      document.body.classList.remove('no-cursor');
    };
  }, []);
  if (!fine) return null;
  return (
    <div ref={ref} className={'cursor' + (label ? ' active' : '')} style={{ opacity: 0 }} aria-hidden="true">
      <i className="dot" /><i className="ring" />
      {label && <span className="clabel">{label}</span>}
    </div>
  );
}
