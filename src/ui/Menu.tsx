import { useEffect, useRef, type CSSProperties, type RefObject } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PATHS, to } from '../contract/routes';
import { useLibraryData } from '../data/library';

interface Entry { label: string; to: string; depth: 0 | 1 | 2; accent?: string }

/** Full-height editorial drawer: numbered rooms, the world map as a tree, current room marked. Owner: Person 1. */
export function Menu({ onClose, returnFocusRef }: { onClose: () => void; returnFocusRef: RefObject<HTMLElement> }) {
  const { pathname } = useLocation();
  const lib = useLibraryData();
  const panel = useRef<HTMLElement>(null);

  const entries: Entry[] = [
    { label: 'Lobby', to: PATHS.lobby, depth: 0 },
    { label: 'Studio', to: PATHS.studio, depth: 0 },
    { label: 'Heaven', to: PATHS.heaven, depth: 0 },
    { label: 'Taste', to: PATHS.taste, depth: 1 },
    { label: 'Library', to: PATHS.library, depth: 1 },
    // scene rooms come from library.json (never hard-coded); nothing is listed until it has loaded
    ...(lib?.rooms ?? []).map((r): Entry => ({ label: r.displayName, to: to.libraryRoom(r.id), depth: 2, accent: r.accent })),
    { label: 'Discover', to: PATHS.discover, depth: 1 },
    { label: 'Playlists', to: PATHS.playlists, depth: 1 },
    { label: 'Archive', to: PATHS.archive, depth: 1 },
  ];

  useEffect(() => {
    const focusables = () => Array.from(panel.current?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []);
    focusables()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }
      if (e.key !== 'Tab') return;
      const f = focusables();
      if (f.length === 0) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    window.addEventListener('keydown', key);
    const back = returnFocusRef.current;
    return () => { window.removeEventListener('keydown', key); back?.focus(); };
  }, [onClose, returnFocusRef]);

  let n = -1;
  return (
    <div className="menu-wrap">
      <div className="menu-backdrop" onClick={onClose} />
      <nav className="menu" ref={panel} aria-label="Main">
        <button className="menu-close hbtn" onClick={onClose}>CLOSE</button>
        <div className="eyebrow">WORLD MAP</div>
        <ol>
          {entries.map((e) => {
            if (e.depth < 2) n += 1;
            const current = pathname === e.to;
            return (
              <li key={e.to} className={'d' + e.depth}>
                <Link to={e.to} aria-current={current ? 'page' : undefined} style={e.accent ? ({ ['--accent' as string]: e.accent } as CSSProperties) : undefined}>
                  <span className="num">{e.depth < 2 ? String(n).padStart(2, '0') : <i className="dot" />}</span>
                  <span>{e.label}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
