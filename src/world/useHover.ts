import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { ThreeEvent } from '@react-three/fiber';
import { useApp } from '../store/app';
import {
  clearHoveredInteractive, getFocusedInteractive, registerInteractive, setHoveredInteractive,
  subscribeFocus, updateInteractiveLabel,
} from './interactive';

let counter = 0;
function useObjectId() {
  const r = useRef('');
  if (!r.current) r.current = `obj${++counter}`;
  return r.current;
}

/**
 * Hover state + custom-cursor label for any 3D object. Spread `bind` onto a <mesh>.
 *  - `label`      text next to the custom cursor ('' = no label).
 *  - `onActivate` (optional) makes the object keyboard-openable: it joins the registry (Tab/arrows + Enter, and Enter while
 *                 the pointer is over it). Pass the same action the click does.
 *  - `name`       (optional) accessible name for keyboard/screen-reader users; defaults to `label`.
 * `hover` is also true while the object has keyboard focus, so one flag drives both highlights.
 */
export function useHover(label: string, onActivate?: () => void, name?: string) {
  const [pointerHover, setHover] = useState(false);
  const setCursor = useApp((s) => s.setCursorLabel);
  const on = useRef(false);
  const id = useObjectId();
  const activateRef = useRef(onActivate);
  activateRef.current = onActivate;
  const interactive = !!onActivate;
  const accessibleName = name || label || 'OPEN';
  const focused = useSyncExternalStore(subscribeFocus, () => getFocusedInteractive() === id, () => false);

  useEffect(() => {
    if (!interactive) return;
    return registerInteractive({ id, label: accessibleName, activate: () => activateRef.current?.() });
  }, [id, interactive]); // eslint-disable-line react-hooks/exhaustive-deps -- label updates go through the next effect
  useEffect(() => { if (interactive) updateInteractiveLabel(id, accessibleName); }, [id, interactive, accessibleName]);
  useEffect(() => () => { if (on.current) setCursor(''); clearHoveredInteractive(id); }, [setCursor, id]);

  const bind = {
    onPointerOver: (e: ThreeEvent<PointerEvent>) => { e.stopPropagation(); on.current = true; setHover(true); setCursor(label); if (interactive) setHoveredInteractive(id); },
    onPointerOut: () => { on.current = false; setHover(false); setCursor(''); clearHoveredInteractive(id); },
  };
  return { hover: pointerHover || focused, focused, bind };
}
