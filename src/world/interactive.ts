// Registry of everything in the 3D world that can be opened (doors, posters, cards). Owner: Person 1.
// Poster and Door register themselves through useHover; the hidden ObjectNav list in the HTML overlay turns the registry
// into real buttons, so Tab / arrow keys / Enter and screen readers work. Pure TypeScript: see shell.check.ts.

export interface Interactive { id: string; label: string; activate: () => void }

const items = new Map<string, Interactive>();
const listeners = new Set<() => void>();
const focusListeners = new Set<() => void>();
let snapshot: Interactive[] = [];
let scheduled = false;
let hoveredId: string | null = null;
let focusedId: string | null = null;

// Registrations arrive in bursts (54 cards mount together), so subscribers are notified once per burst.
function flush() { scheduled = false; snapshot = Array.from(items.values()); listeners.forEach((l) => l()); }
function schedule() { if (scheduled) return; scheduled = true; queueMicrotask(flush); }

export function registerInteractive(item: Interactive): () => void {
  items.set(item.id, item);
  schedule();
  return () => { if (items.get(item.id) === item) { items.delete(item.id); if (hoveredId === item.id) hoveredId = null; schedule(); } };
}
export function updateInteractiveLabel(id: string, label: string) {
  const it = items.get(id);
  if (it && it.label !== label) { it.label = label; schedule(); }
}
export const getInteractives = () => snapshot;
export function subscribeInteractives(l: () => void): () => void { listeners.add(l); return () => { listeners.delete(l); }; }

export function setHoveredInteractive(id: string) { hoveredId = id; }
export function clearHoveredInteractive(id: string) { if (hoveredId === id) hoveredId = null; }
/** Enter key with no control focused: opens whatever the pointer is over. Returns true if something opened. */
export function activateHovered(): boolean {
  const it = hoveredId ? items.get(hoveredId) : undefined;
  if (!it) return false;
  it.activate();
  return true;
}

export const getFocusedInteractive = () => focusedId;
export function setFocusedInteractive(id: string | null) {
  if (focusedId === id) return;
  focusedId = id;
  focusListeners.forEach((l) => l());
}
export function subscribeFocus(l: () => void): () => void { focusListeners.add(l); return () => { focusListeners.delete(l); }; }
