// SHARED CONTRACT. Owner: Person 1.
// CONTRACT v1: declared by Person 1; becomes final after the team's 30-minute review (see docs/TEAM.md, Phase 0).
// Any later change to src/contract/* must be announced to everyone first and logged in CHANGELOG.md.
export const CONTRACT_VERSION = 1;

export const PATHS = {
  lobby: '/',
  studio: '/studio',
  heaven: '/heaven',
  taste: '/heaven/taste',
  library: '/heaven/library',
  libraryRoom: '/heaven/library/:roomId',
  discover: '/heaven/discover',
  playlists: '/heaven/playlists',
  song: '/song/:songId',
  artist: '/artist/:artistId',
  archive: '/archive',
} as const;

export const to = {
  libraryRoom: (roomId: string) => `/heaven/library/${roomId}`,
  song: (songId: string) => `/song/${songId}`,
  artist: (artistId: string) => `/artist/${artistId}`,
};
