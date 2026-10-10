// SHARED CONTRACT. Owner: Person 1. Change only through a reviewed PR.
import type { ComponentType } from 'react';

export interface Room {
  id: string;
  displayName: string;
  accent: string;
  kind: 'scene' | 'special';
  trackCount: number;
}

export interface Song {
  id: string;
  title: string;
  artistIds: string[];
  artistNames: string[];
  album: string | null;
  year: number | null;
  roomId: string;
  wing: 'desi' | 'global' | null;
  isFavourite: boolean;
  tags: string[];
  genreTags: string[];
  coverUrl: string | null;
  dominantColor?: string | null;
  youtubeId: string | null;
  needsReview: boolean;
}

export interface Artist {
  id: string;
  name: string;
  subscribed: boolean;
  roomId: string;
  songCount: number;
  // Filled later by Person 5 (data/artists.json). All optional: the UI must cope with missing values.
  bio?: string | null;
  imageUrl?: string | null;
  genres?: string[];
  origin?: string | null;
  activeYears?: string | null;
}

export interface Library {
  rooms: Room[];
  songs: Song[];
  artists: Artist[];
  songsById: Map<string, Song>;
  artistsById: Map<string, Artist>;
  songsByRoom: Map<string, Song[]>;
  songsByArtist: Map<string, Song[]>;
}

export type RouteParams = Record<string, string | undefined>;
export interface RoomProps { params: RouteParams }

/** Every room is one RoomDef: a 3D Scene (inside the canvas) and optional HTML Panels (over it). */
export interface RoomDef {
  id: string;
  path: string;
  title: string;
  Scene: ComponentType<RoomProps>;
  Panels?: ComponentType<RoomProps>;
}
