import { Link, useLocation } from 'react-router-dom';
import { PATHS } from '../contract/routes';

const TABS = [
  ['LOBBY', PATHS.lobby], ['HEAVEN', PATHS.heaven], ['LIBRARY', PATHS.library],
  ['DISCOVER', PATHS.discover], ['PLAYLISTS', PATHS.playlists], ['TASTE', PATHS.taste],
] as const;

/** Bottom-left tabs of the main rooms (from the reference lobby). Owner: Person 1. */
export function RoomTabs() {
  const { pathname } = useLocation();
  return (
    <nav className="tabs" aria-label="Rooms">
      {TABS.map(([label, path]) => (
        <Link key={path} to={path} aria-current={pathname === path || (path === PATHS.library && pathname.startsWith(PATHS.library + '/')) ? 'page' : undefined}>
          {label}
        </Link>
      ))}
    </nav>
  );
}
