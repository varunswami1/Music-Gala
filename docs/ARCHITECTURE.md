# Architecture

## Stack (and why)
- **Vite + React + TypeScript**: fast dev server, components, no server needed (this is a personal, static app).
- **React Three Fiber + drei (Three.js)**: 3D scenes written as React components.
- **React Router**: one URL per room, so the browser back button and direct links work.
- **Zustand**: tiny global store for UI state (cursor label, hint, sound, last song).
- Not plain HTML: eight rooms with shared state, routing and a team do not fit one file.
- Not Next.js: nothing here needs server rendering.

## The one idea that matters: rooms are plug-ins
```ts
interface RoomDef { id; path; title; Scene /* 3D, inside the canvas */; Panels? /* HTML, over the canvas */ }
```
- One persistent `<Canvas>` (src/world/WorldCanvas.tsx). The room matching the URL renders its `Scene` inside it, so the world feels continuous.
- HTML panels (lyrics, lists, text) are normal React rendered over the canvas by `App.tsx`.
- To add a room: create a `RoomDef` in your own folder, add ONE line in `src/rooms/registry.ts`.
- Inside the canvas there is no router context. To navigate from 3D code use `const go = useApp(s => s.go); go('/song/…')`. In HTML panels use `<Link>`.

## Folders and owners
| Folder | Owner |
|---|---|
| `src/contract/`, `src/store/`, `src/world/`, `src/ui/`, `src/audio/`, `src/App.tsx`, `src/styles.css` | Person 1 (shell) |
| `src/rooms/lobby/`, `src/rooms/studio/` | Person 2 |
| `src/rooms/heaven/`, playlists room | Person 3 |
| `src/rooms/song/`, `src/rooms/artist/`, `src/audio/songPlayer.ts` | Person 4 |
| `src/data/`, `public/data/`, `pipeline/`, `scripts/`, taste/discover/archive rooms | Person 5 |
Never edit another person's folder. Need a change there? Open a PR or ask the owner.

## Data flow
`pipeline/` (Python) → `library_enriched.json` → copy to `public/data/library.json` → `src/data/library.ts` (`useLibrary`, normalised lookups) → rooms.
- Selected song and artist come from the URL (`/song/:songId`, `/artist/:artistId`), never from duplicated state.
- Room names, ids and accent colours come from `library.json` `rooms`; do not hard-code them in rooms.
- Missing data must be handled (null cover, no artist, no bio).

## Covers
Remote covers may be blocked inside WebGL (CORS) and are slow. Run `python scripts/localize_covers.py public/data/library.json`,
then use `library.local.json` as `library.json` and keep `public/covers/` out of git (already in .gitignore).

## Rules
- Contract changes (`src/contract/*`) only by Person 1 after a short review with everyone.
- TypeScript strict. `npm run typecheck` must pass before a PR.
- Branches: `p<number>/<short-name>`. Small PRs. One review from someone else.
- No big libraries without asking. Keep draw calls low: instancing for repeated meshes.
- Clean up: anything you create in `useEffect` is disposed in its cleanup.

## Acceptance checks (run before calling a phase done)
1. Lobby → Heaven → Library → a scene room → double-click a card → Song Room shows that song's cover and details.
2. Click the artist → Artist Room shows that artist and their songs → click another song → correct Song Room.
3. BACK TO LIBRARY returns to the scene overview. Browser back and forward work. A wrong URL shows a calm message.
4. Lyrics scroll without moving the 3D scene. Keys do nothing while typing.
5. Cursor label changes on interactive objects. Sound toggle works, or shows N/A when no file exists.
6. No console errors; no duplicate audio; memory does not grow when moving between rooms 20 times.
