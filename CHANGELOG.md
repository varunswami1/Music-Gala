# Changelog

All notable changes from each team member across all phases are documented below.

## Shell v1 (Person 1)
Things other people depend on:
- `useRoomCamera` gained an optional 4th argument (camera profile override) and now supports drag, scroll and pinch. Existing calls work unchanged.
- `useHover` gained optional `onActivate` and `name`; `Poster` and `Door` use them, so cards and doors are keyboard-openable. Nothing renamed.
- `useReducedMotion()` and `quality` added to the store. Rooms with their own animation should respect reduced motion.
- Room change is now delayed by ~0.25 s (fade, then swap). Code that must run on arrival should use mount effects, not the URL change.
- `CONTRACT_VERSION = 1` added to `src/contract/routes.ts`. `dominantColor` added as optional field on `Song`.
- Shell docs: `docs/SHELL.md`. Pure-logic checks: `npx tsx src/world/shell.check.ts`.

## Person 2: Lobby and Studio
- `rooms/lobby/` and `rooms/studio/` are now full rooms (all doors still work, same routes and ids).
- New shared helpers live in `src/rooms/lobby/models/` (`Model`, `Ring`, `FloorPulse`, `useReducedMotion`, procedural instruments). Other rooms may import `Model` and `Ring`.
- Both rooms add a small keyboard-reachable link row (`Panels`) because the 3D doors have no keyboard access yet (Person 1).
- `docs/ASSETS.md` added: all models are procedural, no external assets.
- Clean procedural aesthetics matching the architectural reference mood.

## Person 3: Heaven, Library, scene-room card ring, Playlists
- **Heaven**: four hanging frames (Taste, Library, Discover, Playlists) with cover collages at different depths, cables to the ceiling, slow drifting covers behind them. Doors to Lobby and Archive kept. Scroll-to-move is Person 1's (camera).
- **Library**: one hanging frame per scene room with a 3x3 cover collage and song count.
- **Scene room / `CardRing`**: songs are grouped into clusters of at most 54 cards (group by ARTIST, YEAR or ALL); only the current cluster is drawn. Wheel or ← → rotate, ↑ ↓ / PageUp / PageDown switch cluster, hover pops the card and shows title + artist, double-click opens the Song Room. Wheel is ignored over HTML panels; keys are ignored while typing. Left panel has GROUP BY and a scrollable cluster list.
- **Playlists room** (`rooms/heaven/Playlists.tsx`): one frame per source playlist, 8 per page (← → or PREV/NEXT; the real library has 43 playlists); opening one shows its songs in the same ring. Long or emoji playlist names are shortened on the 3D label only.
- **For others**:
  - `src/rooms/registry.ts`: imports `playlistsRoom` from `./heaven/Playlists`.
  - Playlist membership read from `sourcePlaylists` in `library.json` by `rooms/heaven/playlists.ts`.
  - Display names for raw playlist names configured in `PLAYLIST_NAMES` in `playlists.ts`.

## Person 4: Song Room, Artist Room, song playback
- `src/audio/songPlayer.ts`: YouTube IFrame player (one at a time, no autoplay, honest status). `usePlayback` store mirrors its state. Fades ambient audio out when a song starts.
- **Song Room**: hanging cover (click = play/pause), tinted from the cover colour, scrollable lyrics, artist panel, embedded player, similar-songs strip.
- **Artist Room**: portrait, details, bio, discography (sorted by year), doors back to Library and to the last song.
- **Back navigation**: `BACK TO LIBRARY` goes to `/heaven/library` (the scene overview, acceptance check 3). Scene room is reachable from ROOM / SCENE link in left panel.
- **Recommendations**: wired to `src/data/recommend.ts` with graceful fallback when recommendations are pending.
- **Lyrics formatting**: normalizes Windows CRLF line endings.

## Person 5: Data Layer, Taste, Discover, Final Data Imported
- **`public/data/artists.json`**: `{ "<artistId>": { bio, bioSource, imageUrl, genres, origin, activeYears } }`. Merged into `Artist` by `useLibrary`. Wikipedia credit displayed when available.
- **`getLyrics(song)` (`src/data/lyrics.ts`)**: reads `public/data/lyrics/<youtubeId>.json` (fallback: song id). 6,680 songs have lyrics; missing entries show "unavailable" honestly.
- **Recommendations (`src/data/recommend.ts`)**: `getRecommendations` supports library queries and outside suggestions; each `Rec` has `reason` and `inLibrary`.
- **`src/data/languages.ts`**: `languageOf(song)` gives derived language label (Hindi, Punjabi, English, Regional, Other) as a filter.
- **`src/data/stats.ts`**, **Taste** (`rooms/taste/`) and **Discover** (`rooms/discover/`) rooms registered.
- **Scripts**: `validate_library.py`, `build_artists.py`, `localize_covers.py`, `build_recs.py`, `import_data.py`. 15 unit tests in `scripts/test_scripts.py`.
- **Final data**: 10,402 songs, 5,303 artists in `public/data/library.json`. 98 enriched artist bios. 6,680 individual lyrics files in `public/data/lyrics/`.
