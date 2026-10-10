import { useEffect, type ReactNode } from 'react';
import { useApp } from '../store/app';

const Mouse = ({ children }: { children?: ReactNode }) => (
  <svg width="64" height="96" viewBox="0 0 64 96" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
    <rect x="14" y="4" width="36" height="58" rx="18" /><path d="M32 4v22M14 26h36" opacity=".5" />{children}
  </svg>
);
const icons: Record<string, ReactNode> = {
  forward: <Mouse><rect x="29" y="12" width="6" height="10" rx="3" fill="currentColor" /><path d="M24 76l8 8 8-8" /></Mouse>,
  rotate: <Mouse><path d="M10 86a26 26 0 0 1 44 0" strokeDasharray="3 4" opacity=".7" /></Mouse>,
  open: <Mouse><path d="M14 26h18V4" fill="currentColor" opacity=".35" /><rect x="0" y="70" width="64" height="18" rx="3" opacity=".7" /></Mouse>,
};

// Only list interactions that really exist (docs/DESIGN.md §5). Each has a mouse and a touch wording.
const STEPS = [
  { key: 'forward', title: 'MOVE FORWARD', text: 'SCROLL THE WHEEL · OR ARROW KEYS ↑ ↓', touch: 'PINCH WITH TWO FINGERS', note: 'IN A SCENE ROOM THE WHEEL TURNS THE CARDS', enabled: true },
  { key: 'rotate', title: 'ROTATE YOUR VIEW', text: 'HOLD THE LEFT BUTTON AND DRAG', touch: 'DRAG WITH ONE FINGER', enabled: true },
  { key: 'open', title: 'CLICK · ENTER TO OPEN', text: 'CLICK WHAT GLOWS · OR TAB TO IT AND PRESS ENTER', touch: 'TAP WHAT GLOWS', enabled: true },
];

export function InteractionGuide() {
  const open = useApp((s) => s.guideOpen);
  const setOpen = useApp((s) => s.setGuideOpen);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [open, setOpen]);
  if (!open) return null;
  const touch = typeof window.matchMedia === 'function' && window.matchMedia('(pointer: coarse)').matches;
  return (
    <div className="guide" role="dialog" aria-label="How to explore">
      <div className="steps">
        {STEPS.filter((s) => s.enabled).map((s) => (
          <div key={s.key}>
            <div className="gicon">{icons[s.key]}</div>
            {s.title}
            <small>{touch ? s.touch : s.text}</small>
            {!touch && s.note && <small className="faint">{s.note}</small>}
          </div>
        ))}
      </div>
      <button onClick={() => setOpen(false)} autoFocus>CLOSE</button>
    </div>
  );
}
