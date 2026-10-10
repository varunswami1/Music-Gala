# Team: five people, five owners

Work is split by **room and folder**, so people rarely touch the same files. Everyone builds on the same shell and the same data file.

## Phases
- **Phase 0 (first day):** everyone runs the starter and reads the docs. Person 1 freezes the contract (`src/contract/`) as v1 after a 30-minute review.
- **Phase 1: the core loop** (Heaven → Library → scene room → Song Room → Artist Room, with real data and covers). Persons 1, 3, 4, 5.
- **Phase 2: the extra worlds** (Lobby, Studio, Taste, Discover, Playlists). Persons 2, 3, 5.
- **Phase 3: polish** (Archive, ambient audio, 2D fallback for mobile, performance, point-cloud figures).
Do not start Phase 2 art before Phase 1 works end to end.

## Person 1: Shell and engine
Owns: contract, store, `world/`, `ui/`, `audio/ambient.ts`, `App.tsx`, `styles.css`.
Build: scroll-to-move and drag-to-look camera (then enable them in `InteractionGuide`), keyboard Enter-to-open and focus states,
a better transition between rooms (camera push + fade), richer atmosphere (particles, fog, reflection tuning), a MENU that matches the design,
a mobile/touch plan, reduced-motion support. Keep shared components (`Poster`, `Door`, `WireCylinder`) stable and documented.
Done when: acceptance checks 5 and 6 pass and other people never need to edit your files.

## Person 2: Lobby and Studio
Owns: `rooms/lobby/`, `rooms/studio/`, 3D asset files.
Build: Lobby with instrument models (wireframe or point cloud) that say "this is a music site", clear tagline, doors. Studio as a dome-like
recording studio: props, instruments, a booth behind glass with two singer figures (Somay and Varun) as point-cloud people, doors to Lobby and Heaven.
Use free CC0 models; record every source and licence in `docs/ASSETS.md`. Keep each room's triangle and point counts small.
Done when: both rooms look finished, keep 60 fps, and every door works.

## Person 3: Heaven, Library and Playlists
Owns: `rooms/heaven/`, the playlists room.
Build: Heaven with hanging frames and drifting covers; Library frames (one per scene room, with a cover collage); the scene room's card ring
(instancing, clusters by artist or year, hover pop with title and artist, double-click to open); the Playlists room (same pattern as Library).
Done when: acceptance check 1 passes with the full 6,000-song library and stays smooth.

## Person 4: Song Room and Artist Room
Owns: `rooms/song/`, `rooms/artist/`, `audio/songPlayer.ts`.
Build: polished cylinder rooms, the hanging cover artwork, left/right panels, scrollable lyrics panel, YouTube embedded playback with play/pause,
progress and volume (one player at a time), tint from the cover's colour, a "similar songs" strip with From library / New tabs (data from Person 5),
return doors. Handle missing everything.
Done when: acceptance checks 2, 3 and 4 pass.

## Person 5: Data (and Taste, Discover, Archive)
Owns: `data/`, `public/data/`, `pipeline/`, `scripts/`, `rooms/stubs.tsx` until each room gets its own folder.
Build: run the pipeline and enrichment to produce the best `library.json`; localise covers; artist bios and portraits (`data/artists.json`, optional fields on `Artist`);
a licensed lyrics source behind `getLyrics`; recommendation service (similar songs from outside the library, each with a reason, marked `inLibrary`);
then the Taste room and the Discover room. Reconcile the language labels from the old prototype with the six scene rooms (language = filter, scene = room).
Done when: the whole library loads with correct covers, artists have bios where available, lyrics show or say "unavailable" honestly.

## Working agreements
- One owner per folder. Cross-folder changes go through a pull request to the owner.
- Contract changes (types, routes, `library.json` fields) are announced to everyone first.
- Demo the app to each other at the end of every phase using the acceptance checks in `docs/ARCHITECTURE.md`.
- Keep a short `CHANGELOG.md` entry for anything others depend on.

## Brief template for an AI coding assistant (one per person)
> You are working on the Music Gallery repo. Read AGENTS.md first and follow it (it lists the docs and the reference pictures in docs/reference/).
> I am **Person N**. Only edit the folders I own. Do not change `src/contract/`. Build: <paste my section from TEAM.md>.
> Before coding, list the files you will change. Use the existing `Poster`, `Door`, `useRoomCamera`, `useHint` and the `go()` function.
> Handle missing data gracefully. When finished, run `npm run typecheck`, then tell me which acceptance checks you actually ran and which passed.
> Never claim something works unless you ran it.
