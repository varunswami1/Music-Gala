// ARTIST ROOM. Owner: Person 4 (same round-room look as the Song Room). Driven by :artistId.
// Centre: portrait. Left: details + bio. Right: scrollable, clickable discography. Doors: BACK TO LIBRARY, BACK TO SONG.
import { Link } from 'react-router-dom';
import { Text } from '@react-three/drei';
import type { RoomDef, RoomProps } from '../../contract/types';
import { PATHS, to } from '../../contract/routes';
import { useApp, useHint } from '../../store/app';
import { useLibraryData } from '../../data/library';
import { useRoomCamera } from '../../world/useRoomCamera';
import { Door } from '../../world/Door';
import { RoundRoom, doorAt } from '../song/RoundRoom';
import { useCoverTint } from '../song/useCoverTint';
import '../song/roundRoom.css';

function useArtist(artistId: string | undefined) {
  const lib = useLibraryData();
  const artist = lib?.artistsById.get(artistId ?? '');
  const songs = (artist && lib?.songsByArtist.get(artist.id)) || [];
  const room = lib?.rooms.find((r) => r.id === artist?.roomId);
  // No portrait yet (Person 5 fills imageUrl): borrow the colour of their first cover, else the room accent.
  const tint = useCoverTint(artist?.imageUrl ?? songs.find((s) => s.coverUrl)?.coverUrl, room?.accent ?? '#ffffff');
  return { lib, artist, songs, room, tint };
}

function ArtistScene({ params }: RoomProps) {
  const go = useApp((s) => s.go);
  const lastSongId = useApp((s) => s.lastSongId);
  const { lib, artist, tint } = useArtist(params.artistId);
  useRoomCamera([0, 1.7, 7], [0, 2.2, -5], 0.3);
  useHint('MOVE THE MOUSE TO LOOK · PICK A SONG ON THE RIGHT OR USE A DOOR');
  if (!artist) return lib ? <Text position={[0, 2, -4]} fontSize={0.25} color="#8a8a8a">ARTIST NOT FOUND</Text> : null;
  const back = lastSongId && lib?.songsById.has(lastSongId) ? lastSongId : null;
  return (
    <RoundRoom word={artist.name} title={artist.name} image={artist.imageUrl} size={[3, 3.6]} tint={tint} caption={artist.name}>
      <Door label="BACK TO LIBRARY" {...doorAt(32)} accent={tint} cursorLabel="BACK TO LIBRARY" onOpen={() => go(PATHS.library)} />
      {back && <Door label="BACK TO SONG" {...doorAt(-32)} accent={tint} cursorLabel="BACK TO SONG" onOpen={() => go(to.song(back))} />}
    </RoundRoom>
  );
}

function ArtistPanels({ params }: RoomProps) {
  const lastSongId = useApp((s) => s.lastSongId);
  const { lib, artist, songs, room, tint } = useArtist(params.artistId);
  if (!lib) return null;
  if (!artist) return <div className="panel left"><div className="eyebrow">ARTIST NOT FOUND</div><p className="note">THIS LINK DOES NOT MATCH ANY ARTIST IN THE LIBRARY</p><Link className="btn" to={PATHS.library}>BACK TO LIBRARY</Link></div>;
  const tags = [...new Set(songs.flatMap((s) => [...s.tags, ...s.genreTags]))].slice(0, 6);
  const sorted = [...songs].sort((a, b) => (b.year ?? 0) - (a.year ?? 0) || a.title.localeCompare(b.title));
  const style = { ['--tint' as string]: tint };
  return (
    <>
      <aside className="panel left sp-left sp-artist-left" style={style}>
        <div className="eyebrow">ARTIST</div>
        <h1>{artist.name}</h1>
        <div className="meta">
          <span>SCENE</span><b>{room ? <Link to={to.libraryRoom(room.id)}>{room.displayName}</Link> : '—'}</b>
          <span>SONGS</span><b>{songs.length}</b>
          <span>GENRES</span><b>{(artist.genres?.length ? artist.genres : tags).join(', ') || '—'}</b>
          <span>ORIGIN</span><b>{artist.origin ?? '—'}</b>
          <span>ACTIVE</span><b>{artist.activeYears ?? '—'}</b>
        </div>
        <div className="bio scroll grow" tabIndex={0} role="region" aria-label="Biography" onWheel={(e) => e.stopPropagation()}>
          {artist.bio ?? 'Biography not available yet.'}
        </div>
      </aside>
      <aside className="panel right sp-right sp-artist-right" style={style}>
        <div className="eyebrow">DISCOGRAPHY · {songs.length}</div>
        {sorted.length === 0
          ? <p className="note">NO SONGS BY THIS ARTIST ARE IN THE LIBRARY</p>
          : (
            <div className="list" onWheel={(e) => e.stopPropagation()}>
              {sorted.map((s) => (
                <Link key={s.id} className="row" to={to.song(s.id)} aria-current={s.id === lastSongId ? 'true' : undefined}>
                  <span>{s.title}<br /><small>{[s.album, s.year].filter(Boolean).join(' · ') || '—'}</small></span>
                  {s.coverUrl ? <img src={s.coverUrl} alt="" loading="lazy" /> : <span />}
                </Link>
              ))}
            </div>
          )}
      </aside>
    </>
  );
}
export const artistRoom: RoomDef = { id: 'artist', path: PATHS.artist, title: 'Artist', Scene: ArtistScene, Panels: ArtistPanels };
