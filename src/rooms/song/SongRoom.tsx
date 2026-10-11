// SONG ROOM. Owner: Person 4. Everything is driven by the :songId in the URL.
// Centre: the cover hangs from the ceiling on cables (click it to play/pause). Left: details + scrollable lyrics.
// Right: artist + embedded YouTube player. Bottom: similar songs (FROM LIBRARY / NEW). Doors: BACK TO LIBRARY, VIEW ARTIST.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Text } from '@react-three/drei';
import type { RoomDef, RoomProps } from '../../contract/types';
import { PATHS, to } from '../../contract/routes';
import { useApp, useHint } from '../../store/app';
import { useLibraryData } from '../../data/library';
import { getLyrics, type Lyrics } from '../../data/lyrics';
import { canControl, toggleActivePlayback, usePlayback } from '../../audio/songPlayer';
import { Door } from '../../world/Door';
import { RoundRoom, doorAt, ROOM_CAMERA, COVER_SIZE } from './RoundRoom';
import { useLookCamera } from './useLookCamera';
import { PlayerPanel } from './PlayerPanel';
import { SimilarStrip } from './SimilarStrip';
import './roundRoom.css';

function useSong(songId: string | undefined) {
  const lib = useLibraryData();
  const song = lib?.songsById.get(songId ?? '');
  const room = lib?.rooms.find((r) => r.id === song?.roomId);
  return { lib, song, room };
}

function SongScene({ params }: RoomProps) {
  const go = useApp((s) => s.go);
  const { lib, song } = useSong(params.songId);
  const status = usePlayback((s) => s.status);
  const canPlay = !!song?.youtubeId && canControl(status);
  useLookCamera(ROOM_CAMERA.position, ROOM_CAMERA.look, 0.25);
  useHint(song?.youtubeId ? 'DRAG OR USE ← → TO LOOK AROUND · SPACE PLAYS / PAUSES · DOORS ARE TO YOUR LEFT AND RIGHT' : 'DRAG OR USE ← → TO LOOK AROUND · DOORS ARE TO YOUR LEFT AND RIGHT');
  if (!song) return lib ? <Text position={[0, 2, -4]} fontSize={0.25} color="#8a8a8a">SONG NOT FOUND</Text> : null;
  const artistId = song.artistIds.find((id) => lib?.artistsById.has(id));
  const left = doorAt(-110), right = doorAt(110);
  return (
    <RoundRoom
      word={song.title} title={song.title} image={song.coverUrl} size={COVER_SIZE}
      caption={`${song.title} · ${song.artistNames.join(', ') || 'Unknown artist'}`}
      posterLabel={canPlay ? (status === 'playing' || status === 'buffering' ? 'PAUSE' : 'PLAY') : ''} onPoster={toggleActivePlayback}
    >
      <Door label="BACK TO LIBRARY" {...right} cursorLabel="BACK TO LIBRARY" onOpen={() => go(PATHS.library)} />
      {artistId && <Door label="VIEW ARTIST" {...left} cursorLabel="VIEW ARTIST" onOpen={() => go(to.artist(artistId))} />}
    </RoundRoom>
  );
}

function LyricsPanel({ songId }: { songId: string }) {
  const lib = useLibraryData();
  const song = lib?.songsById.get(songId);
  const [lyrics, setLyrics] = useState<Lyrics | null>(null);
  useEffect(() => {
    let live = true;
    setLyrics(null);
    if (!song) return;
    getLyrics(song).then((l) => { if (live) setLyrics(l); }).catch(() => { if (live) setLyrics({ status: 'unavailable', reason: 'Lyrics could not be loaded.' }); });
    return () => { live = false; };
  }, [song]);
  return (
    <div className="lyrics" tabIndex={0} role="region" aria-label="Lyrics" onWheel={(e) => e.stopPropagation()}>
      {!lyrics && 'LOADING LYRICS…'}
      {lyrics?.status === 'unavailable' && `LYRICS UNAVAILABLE\n${lyrics.reason}`}
      {lyrics?.status === 'ok' && <>{lyrics.text.replace(/\r\n?/g, '\n')}{lyrics.source ? <><br /><br /><span className="note">LYRICS: {lyrics.source}</span></> : null}</>}
    </div>
  );
}

function SongPanels({ params }: RoomProps) {
  const { lib, song, room } = useSong(params.songId);
  if (!lib) return null;
  if (!song) return <div className="panel left"><div className="eyebrow">SONG NOT FOUND</div><p className="note">THIS LINK DOES NOT MATCH ANY SONG IN THE LIBRARY</p><Link className="btn" to={PATHS.library}>BACK TO LIBRARY</Link></div>;
  const artist = lib.artistsById.get(song.artistIds[0] ?? '');
  const firstName = artist?.name ?? song.artistNames[0];
  return (
    <>
      <aside className="panel left sp-left">
        <div className="eyebrow">{room?.displayName ?? 'SONG'} · SONG{song.needsReview ? ' · DETAILS UNCONFIRMED' : ''}</div>
        <h1>{song.title}</h1>
        <div>
          {song.artistIds.length === 0 && <span className="eyebrow">UNKNOWN ARTIST</span>}
          {song.artistIds.map((id, i) => (
            <span key={id}>{i > 0 && ', '}{lib.artistsById.has(id)
              ? <Link className="artist-link" to={to.artist(id)}>{song.artistNames[i] ?? lib.artistsById.get(id)?.name ?? 'Artist'}</Link>
              : <span>{song.artistNames[i] ?? 'Artist'}</span>}</span>
          ))}
        </div>
        <div className="meta">
          <span>ALBUM</span><b>{song.album ?? '—'}</b>
          <span>YEAR</span><b>{song.year ?? '—'}</b>
          <span>ROOM</span><b>{room ? <Link to={to.libraryRoom(room.id)}>{room.displayName}</Link> : '—'}</b>
          <span>TAGS</span><b>{[...song.tags, ...song.genreTags].slice(0, 5).join(', ') || '—'}</b>
        </div>
        <LyricsPanel key={song.id} songId={song.id} />
      </aside>
      <aside className="panel right sp-right">
        <div className="eyebrow">ARTIST</div>
        <h1>{firstName ?? 'Unknown artist'}</h1>
        <div className="bio scroll" tabIndex={0} role="region" aria-label="Artist biography" onWheel={(e) => e.stopPropagation()} style={{ flex: '1 1 0', maxHeight: 120 }}>
          {artist?.bio ?? 'Biography not available yet.'}
        </div>
        {artist && <Link className="btn" to={to.artist(artist.id)}>VIEW ARTIST</Link>}
        <PlayerPanel key={song.id} youtubeId={song.youtubeId} />
      </aside>
      <SimilarStrip key={song.id} song={song} />
    </>
  );
}
export const songRoom: RoomDef = { id: 'song', path: PATHS.song, title: 'Song', Scene: SongScene, Panels: SongPanels };
