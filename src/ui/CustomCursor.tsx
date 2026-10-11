import { useEffect, useRef, useState } from 'react';
import { useApp } from '../store/app';

/** Cursor copied from the reference: a small white dot; over something you can open it grows into a white disc with a
 *  short black label (OPEN, ENTER...). Long labels become OPEN here and show in full in the hint line. Follows with a soft lag. */
export function CustomCursor() {
  const label = useApp((s) => s.cursorLabel);
  const reduced = useApp((s) => s.reducedMotion);
  const ref = useRef<HTMLDivElement>(null);
  const [fine, setFine] = useState(false);
  useEffect(() => {
    const m = window.matchMedia('(pointer: fine)');
    const apply = () => { setFine(m.matches); document.body.classList.toggle('no-cursor', m.matches); };
    apply();
    m.addEventListener('change', apply);
    return () => { m.removeEventListener('change', apply); document.body.classList.remove('no-cursor'); };
  }, []);
  useEffect(() => {
    if (!fine) return;
    const t = { x: -100, y: -100 }, p = { x: -100, y: -100 };
    let raf = 0, seen = false;
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return;
      t.x = e.clientX; t.y = e.clientY;
      if (!seen) { seen = true; p.x = t.x; p.y = t.y; if (ref.current) ref.current.style.opacity = '1'; }
    };
    const leave = () => { if (ref.current) ref.current.style.opacity = '0'; seen = false; };
    const tick = () => {
      const k = reduced ? 1 : 0.28;
      p.x += (t.x - p.x) * k; p.y += (t.y - p.y) * k;
      if (ref.current) ref.current.style.transform = `translate(${p.x}px, ${p.y}px)`;
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener('pointermove', move);
    document.documentElement.addEventListener('pointerleave', leave);
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', move);
      document.documentElement.removeEventListener('pointerleave', leave);
    };
  }, [fine, reduced]);
  if (!fine) return null;
  const text = label && label.length <= 9 ? label : label ? 'OPEN' : '';
  return (
    <div ref={ref} className={'cursor' + (label ? ' active' : '')} style={{ opacity: 0 }} aria-hidden="true">
      <span className="blob"><span className="clabel">{text}</span></span>
    </div>
  );
}
