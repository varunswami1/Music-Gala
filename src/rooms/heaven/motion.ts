// Small helper shared by the Heaven-folder rooms. Owner: Person 3.
export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' && !!window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
