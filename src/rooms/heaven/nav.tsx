// Top navigation bar, breadcrumb, search and the zoom lock for Heaven and its rooms. Owner: Person 3.
// Mounted ONCE in App (next to <Header />). It only draws itself under /heaven/* and /archive; the zoom lock is always on.
import { useEffect, useMemo, useRef, useState } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import type { Song } from '../../contract/types';
import { PATHS, to } from '../../contract/routes';
import { useLibraryData } from '../../data/library';
import { isTyping } from './motion';
import { useRing } from './ringStore';
import { usePlaylistView } from './playlistsStore';
import { tunnelDo, tunnelGo } from './tunnel';
import './heaven.css';

const NAV: [string, string][] = [
  ['HEAVEN', PATHS.heaven], ['LIBRARY', PATHS.library], ['PLAYLISTS', PATHS.playlists],
  ['TASTE', PATHS.taste], ['DISCOVER', PATHS.discover], ['ARCHIVE', PATHS.archive],
];

/** No touchpad zoom, ever: block pinch (ctrl+wheel in Chrome/Firefox, gesture events in Safari). Walking/zooming is keyboard only. */
function useZoomLock() {
  useEffect(() => {
    const wheel = (e: WheelEvent) => { if (e.ctrlKey) e.preventDefault(); };
    const gesture = (e: Event) => e.preventDefault();
    const names = ['gesturestart', 'gesturechange', 'gestureend'];
    window.addEventListener('wheel', wheel, { passive: false });
    names.forEach((n) => window.addEventListener(n, gesture, { passive: false }));
    return () => { window.removeEventListener('wheel', wheel); names.forEach((n) => window.removeEventListener(n, gesture)); };
  }, []);
}

const NONE: Song[] = [];

function SearchBox() {
  const lib = useLibraryData();
  const pool = useRing((s) => s.pool);
  const inRoom = pool.length > 0;
  const source = inRoom ? pool : lib?.songs ?? NONE;
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (s.length < 2) return NONE;
    const out: Song[] = [];
    for (const song of source) {
      if (`${song.title} ${song.artistNames.join(' ')}`.toLowerCase().includes(s)) { out.push(song); if (out.length >= 8) break; }
    }
    return out;
  }, [q, source]);
  useEffect(() => setSel(0), [results]);

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === '/' && !isTyping(e) && !e.metaKey && !e.ctrlKey && !e.altKey) { e.preventDefault(); input.current?.focus(); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  const pick = (song: Song) => {
    setQ(''); input.current?.blur();
    const ring = useRing.getState();
    if (ring.pool.length) { ring.requestFocus(song.id); return; }       // inside a round room: bring the card to the front
    ring.setPending(song.id);                                            // elsewhere: go to its room, it will be brought forward there
    tunnelGo(to.libraryRoom(song.roomId), lib?.rooms.find((r) => r.id === song.roomId)?.displayName ?? '');
  };
  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSel((i) => Math.min(results.length - 1, i + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((i) => Math.max(0, i - 1)); }
    else if (e.key === 'Enter' && results[sel]) pick(results[sel]);
    else if (e.key === 'Escape') { setQ(''); input.current?.blur(); }
    e.stopPropagation();   // typing must never walk the corridor or turn the ring
  };
  return (
    <div className="hsearch">
      <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onKey} spellCheck={false}
        placeholder={inRoom ? 'SEARCH THIS ROOM  /' : 'SEARCH SONGS  /'} aria-label="Search songs" />
      {results.length > 0 && (
        <div className="hresults" role="listbox">
          {results.map((s, i) => (
            <button key={s.id} type="button" role="option" aria-selected={i === sel} onMouseEnter={() => setSel(i)} onClick={() => pick(s)}>
              {s.title}<small>{s.artistNames.join(', ') || 'Unknown artist'}</small>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function HeavenNav() {
  const { pathname } = useLocation();
  const lib = useLibraryData();
  const selectedId = usePlaylistView((s) => s.selectedId);
  const selectedName = usePlaylistView((s) => s.selectedName);
  useZoomLock();
  const on = pathname.startsWith('/heaven') || pathname === PATHS.archive;
  const roomId = matchPath(PATHS.libraryRoom, pathname)?.params.roomId;
  const roomName = roomId ? lib?.rooms.find((r) => r.id === roomId)?.displayName ?? '' : '';

  const up = () => {
    if (pathname === PATHS.playlists && usePlaylistView.getState().selectedId) tunnelDo(() => usePlaylistView.getState().select(null), 'PLAYLISTS');
    else if (roomId) tunnelGo(PATHS.library, 'LIBRARY');
    else if (pathname !== PATHS.heaven) tunnelGo(PATHS.heaven, 'HEAVEN');
  };
  const upRef = useRef(up); upRef.current = up;
  useEffect(() => {
    if (!on) return;
    const k = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || isTyping(e) || document.querySelector('.menu')) return;   // Esc also closes the header menu
      upRef.current();
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [on]);
  if (!on) return null;

  const open = (label: string, path: string) => {
    if (path === pathname) { if (path === PATHS.playlists && selectedId) up(); return; }
    tunnelGo(path, label);
  };
  return (
    <>
      <div className="hnav">
        <nav aria-label="Heaven">
          {NAV.map(([label, path]) => {
            const current = path === PATHS.heaven ? pathname === path : pathname.startsWith(path);
            return <button key={path} type="button" aria-current={current ? 'page' : undefined} onClick={() => open(label, path)}>{label}</button>;
          })}
        </nav>
        {roomId && <div className="hcrumb"><button type="button" onClick={up}>LIBRARY</button> › <b>{roomName}</b></div>}
        {pathname === PATHS.playlists && selectedId && <div className="hcrumb"><button type="button" onClick={up}>PLAYLISTS</button> › <b>{selectedName}</b></div>}
      </div>
      <SearchBox />
    </>
  );
}

export { TunnelOverlay } from './tunnel';
