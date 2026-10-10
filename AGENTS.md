# Instructions for AI coding assistants (read this first)

## Project
Music Gallery: a personal, unpublished 3D music gallery. Library songs become rooms you walk through.
Stack: Vite, React, TypeScript, React Three Fiber (Three.js), React Router, Zustand.

## Read in this order, before writing code
1. `README.md` (how to run)
2. `docs/DESIGN.md` (what we are building, the rooms, the look)
3. `docs/ARCHITECTURE.md` (code structure, rules, acceptance checks)
4. `docs/TEAM.md` (who owns which folder, phases, briefs)
5. `docs/REFERENCE.md` and the pictures in `docs/reference/` (the visual reference; do not ask for videos)

## Rules
- Ask which person (1 to 5) the user is. Edit only the folders that person owns (see docs/TEAM.md). Never change `src/contract/` unless the user says Person 1 approved it.
- Reuse `Poster`, `Door`, `WireBox`, `WireCylinder`, `useRoomCamera`, `useHint`, `useHover`, and navigate from 3D code with `useApp(s => s.go)`.
- A room is a `RoomDef` (Scene + optional Panels) added with one line in `src/rooms/registry.ts`.
- Selected song and artist come from the URL, not duplicated state. Handle missing data (no cover, no artist, no lyrics) with calm placeholders.
- Borrow the mood of the reference site only. Do not copy its name, texts, models or code.
- Lyrics only from a licensed source. Never invent or scrape lyrics. Never extract audio. Do not claim playback that is not happening.
- Only show UI instructions for interactions that actually exist.

## Working method
1. List the files you will create or change, then wait for a yes if the change is large.
2. Make small, reviewable changes. Dispose everything you create in effects.
3. Run `npm run typecheck` and `npm run dev` if you can. Report honestly which acceptance checks (docs/ARCHITECTURE.md) you ran and which passed. Never say something works if you did not run it.
