// THE ROOM REGISTRY. To add a room: create a RoomDef in your folder and add one line here.
import { matchPath } from 'react-router-dom';
import type { RoomDef, RouteParams } from '../contract/types';
import { lobbyRoom } from './lobby/Lobby';
import { studioRoom } from './studio/Studio';
import { heavenRoom } from './heaven/Heaven';
import { libraryRoom } from './heaven/Library';
import { libraryRoomRoom } from './heaven/LibraryRoom';
import { songRoom } from './song/SongRoom';
import { artistRoom } from './artist/ArtistRoom';
import { playlistsRoom } from './heaven/Playlists';
import { tasteRoom } from './taste/Taste';
import { discoverRoom } from './discover/Discover';
import { archiveRoom } from './stubs';

export const ROOMS: RoomDef[] = [
  lobbyRoom, studioRoom, heavenRoom, libraryRoom, libraryRoomRoom,
  songRoom, artistRoom, tasteRoom, discoverRoom, playlistsRoom, archiveRoom,
];

export function findRoom(pathname: string): { room: RoomDef; params: RouteParams } | null {
  for (const room of ROOMS) {
    const m = matchPath({ path: room.path, end: true }, pathname);
    if (m) return { room, params: m.params as RouteParams };
  }
  return null;
}
