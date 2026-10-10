// Keyboard helpers shared by every shortcut. Owner: Person 1.

/** True when a key press belongs to a text field or to a panel that wants its own keys (e.g. the lyrics panel). */
export function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || typeof el.tagName !== 'string') return false;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable) return true;
  return !!el.closest?.('.lyrics, [data-no-shortcuts]');
}
