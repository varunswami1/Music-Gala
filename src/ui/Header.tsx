import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PATHS } from '../contract/routes';
import { Menu } from './Menu';

/** BACK / wordmark / MENU, same on every room. Owner: Person 1. "MUSIC GALLERY" is a placeholder name. */
export function Header() {
  const nav = useNavigate();
  const { pathname, key } = useLocation();
  const [open, setOpen] = useState(false);
  const menuBtn = useRef<HTMLButtonElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useEffect(() => { setOpen(false); }, [pathname]);
  // key === 'default' means this is the first page of the session: history(-1) would leave the app
  const firstPage = key === 'default';
  const back = () => (firstPage ? nav(PATHS.lobby) : nav(-1));
  return (
    <>
      <header className="header">
        <button className="hbtn" onClick={back} disabled={firstPage && pathname === PATHS.lobby}>BACK</button>
        <Link className="wordmark" to={PATHS.lobby}>MUSIC GALLERY</Link>
        <button ref={menuBtn} className="hbtn" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-haspopup="true">MENU</button>
      </header>
      {open && <Menu onClose={close} returnFocusRef={menuBtn} />}
    </>
  );
}
