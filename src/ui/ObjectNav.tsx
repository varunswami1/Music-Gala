import { useEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useApp } from '../store/app';
import {
  activateHovered, getFocusedInteractive, getInteractives, setFocusedInteractive, subscribeInteractives,
} from '../world/interactive';
import { isTypingTarget } from './keys';

/** Enter with no control focused opens whatever the pointer is over (the "press Enter to open" of the guide). */
function useEnterToOpen() {
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.repeat || e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if (isTypingTarget(e.target)) return;
      const t = e.target as HTMLElement | null;
      if (t && t !== document.body && t !== document.documentElement) return; // a real button/link handles its own Enter
      if (activateHovered()) e.preventDefault();
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, []);
}

/**
 * Keyboard + screen-reader access to the 3D world. Every Door/Poster with an action appears here as a real (visually hidden)
 * button. One Tab stop; arrow keys / Home / End move between objects (and do NOT leak to room shortcuts such as the card ring);
 * Enter or Space opens. The focused object lights up in 3D and its name shows above the hint line.
 */
export function ObjectNav() {
  const items = useSyncExternalStore(subscribeInteractives, getInteractives, getInteractives);
  const setFocusLabel = useApp((s) => s.setFocusLabel);
  const [tabId, setTabId] = useState<string | null>(null);
  const refs = useRef(new Map<string, HTMLButtonElement | null>());
  useEnterToOpen();

  useEffect(() => {
    const f = getFocusedInteractive();
    if (f && !items.some((i) => i.id === f)) { setFocusedInteractive(null); setFocusLabel(''); } // focused object left the scene
  }, [items, setFocusLabel]);
  useEffect(() => () => { setFocusedInteractive(null); setFocusLabel(''); }, [setFocusLabel]);

  if (items.length === 0) return null;
  const current = items.some((i) => i.id === tabId) ? tabId : items[0].id;
  const n = items.length;
  const focusAt = (i: number) => {
    const it = items[((i % n) + n) % n];
    setTabId(it.id);
    refs.current.get(it.id)?.focus();
  };
  const onKey = (e: ReactKeyboardEvent, i: number) => {
    let next: number | null = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') next = i + 1;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') next = i - 1;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = n - 1;
    if (next === null) return;
    e.preventDefault();
    e.stopPropagation();
    focusAt(next);
  };

  return (
    <div className="objnav" role="group" aria-label="Objects in this room. Arrow keys move between them, Enter opens.">
      {items.map((it, i) => (
        <button
          key={it.id}
          ref={(el) => { refs.current.set(it.id, el); }}
          tabIndex={it.id === current ? 0 : -1}
          onFocus={() => { setTabId(it.id); setFocusedInteractive(it.id); setFocusLabel(it.label); }}
          onBlur={() => { if (getFocusedInteractive() === it.id) { setFocusedInteractive(null); setFocusLabel(''); } }}
          onKeyDown={(e) => onKey(e, i)}
          onClick={() => it.activate()}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
