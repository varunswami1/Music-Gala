// Small helper shared by the Heaven-folder rooms. Owner: Person 3.
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** True when a key event comes from a text field (so room shortcuts must stay quiet). */
export const isTyping = (e: KeyboardEvent): boolean => {
  const t = e.target as HTMLElement | null;
  return !!t && (/INPUT|TEXTAREA|SELECT/.test(t.tagName) || t.isContentEditable);
};
