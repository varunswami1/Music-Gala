import { useEffect } from 'react';
import { matchPath, useLocation, useNavigate } from 'react-router-dom';
import { WorldCanvas } from './world/WorldCanvas';
import { useTransitionedPath } from './world/useTransition';
import { findRoom } from './rooms/registry';
import { Header } from './ui/Header';
import { ObjectNav } from './ui/ObjectNav';
import { RoomTabs } from './ui/RoomTabs';
import { CustomCursor } from './ui/CustomCursor';
import { ControlsOverlay } from './ui/ControlsOverlay';
import { InteractionGuide } from './ui/InteractionGuide';
import { Fade, FocusLabel, HintBar, LoadState, NotFound } from './ui/Misc';
import { Warp } from './ui/Warp';
import { HeavenNav, TunnelOverlay } from './rooms/heaven/nav';
import { runTransition } from './world/transition';
import { useApp, useSyncReducedMotion } from './store/app';
import { useLibrary } from './data/library';
import { initAmbient } from './audio/ambient';
import { PATHS } from './contract/routes';

export default function App() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const setGo = useApp((s) => s.setGo);
  const setLastSongId = useApp((s) => s.setLastSongId);
  const reduced = useApp((s) => s.reducedMotion);
  const load = useLibrary((s) => s.load);
  useSyncReducedMotion();
  // `shown` lags the URL while the screen fades out, so scene and panels switch together behind black
  const { shown, phase } = useTransitionedPath(pathname, reduced);
  const hit = findRoom(shown);
  const Panels = hit?.room.Panels;

  useEffect(() => { setGo((p) => runTransition(p, navigate)); }, [navigate, setGo]);
  useEffect(() => { load(); initAmbient(); }, [load]);
  useEffect(() => {
    const m = matchPath(PATHS.song, pathname);
    if (m?.params.songId) setLastSongId(m.params.songId);
  }, [pathname, setLastSongId]);
  useEffect(() => { document.title = `${hit ? hit.room.title : 'Not found'} · Music Gallery`; }, [hit]);

  return (
    <>
      <WorldCanvas shownPath={shown} phase={phase} />
      <div className="overlay">
        <Header />
        <HeavenNav />
        <ObjectNav />
        {hit ? Panels && <Panels params={hit.params} /> : <NotFound />}
        <HintBar />
        <FocusLabel />
        <LoadState />
        <RoomTabs />
        <ControlsOverlay />
      </div>
      <InteractionGuide />
      <Fade phase={phase} />
      <TunnelOverlay />
      <Warp />
      <CustomCursor />
    </>
  );
}
