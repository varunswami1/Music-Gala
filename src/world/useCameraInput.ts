import { useEffect, type RefObject } from 'react';
import { cam, dragBy, pinchBy, wheelBy } from './cameraInput';
import { isTypingTarget } from '../ui/keys';

/**
 * Drag-to-look (mouse or one finger), scroll-to-move (wheel), pinch-to-move (two fingers), ArrowUp/ArrowDown to move.
 * Listens on the 3D container only, so HTML panels (lyrics, lists, menu) keep their own scrolling and never move the world.
 * No pointer capture: that would hide pointer events from the canvas and break clicks on 3D objects.
 */
export function useCameraInput(ref: RefObject<HTMLElement>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pointers = new Map<number, { x: number; y: number }>();
    let pinch = 0;
    let moved = 0;
    const gap = () => {
      const [a, b] = Array.from(pointers.values());
      return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    };
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse' && e.button !== 0) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      moved = 0;
      if (pointers.size === 2) pinch = gap();
    };
    const move = (e: PointerEvent) => {
      const p = pointers.get(e.pointerId);
      if (!p) return;
      const dx = e.clientX - p.x, dy = e.clientY - p.y;
      p.x = e.clientX; p.y = e.clientY;
      if (pointers.size >= 2) {
        const g = gap();
        if (pinch) pinchBy(g - pinch);
        pinch = g;
        return;
      }
      moved += Math.abs(dx) + Math.abs(dy);
      if (moved > 4) document.body.classList.add('dragging');
      dragBy(dx, dy);
    };
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      pinch = 0;
      if (pointers.size === 0) document.body.classList.remove('dragging');
    };
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey || !el.contains(e.target as Node)) return; // browser zoom, or the pointer is over an HTML panel
      wheelBy(e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1));
    };
    const key = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || isTypingTarget(e.target)) return;
      const t = e.target as HTMLElement | null;
      if (t && t !== document.body && t !== document.documentElement) return; // a control has focus: leave its keys alone
      // wheelBy returns false in rooms that use the keys themselves (the card ring), so nothing is swallowed there
      if (e.key === 'ArrowDown' && wheelBy(60)) e.preventDefault();
      else if (e.key === 'ArrowUp' && wheelBy(-60)) e.preventDefault();
    };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    window.addEventListener('wheel', wheel, { passive: true });
    window.addEventListener('keydown', key);
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      window.removeEventListener('wheel', wheel);
      window.removeEventListener('keydown', key);
      document.body.classList.remove('dragging');
      cam.yawTarget = cam.pitchTarget = 0;
    };
  }, [ref]);
}
