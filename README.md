# Music Gala

A personal 3D music gallery. Your YouTube Music library becomes rooms you can walk through.
Dark wireframe architectural aesthetic, procedural point-cloud assets, full audio playback, lyrics, and recommendations.
Built with React 18, Three.js (React Three Fiber), Vite and TypeScript.

## Run it
```bash
npm install
npm run dev          # open http://localhost:5173
npm run typecheck    # TypeScript checks
npm run build        # Production bundle build
```
The full library (10,402 songs, 5,303 artists) is included in `public/data/library.json`.

> The versions in package.json are pinned from memory and this starter was written without being able to run `npm install`.
> If install or the first run complains, fix the version or the small error and tell the team what you changed.

## Read in this order (AI assistants: start with AGENTS.md)
1. `docs/DESIGN.md`: what we are building and how it should feel
2. `docs/ARCHITECTURE.md`: how the code is organised and the rules
3. `docs/TEAM.md`: who owns what, the phases, and a build brief per person
4. `docs/REFERENCE.md` + `docs/reference/` (the visual reference, as pictures, so nobody needs the videos)
5. `docs/PIPELINE_SPEC_v0.3.md`: how the data was produced (room names and data parts still apply)

## What is in the box
- `src/` the app (shell, shared 3D parts, every room as a working placeholder)
- `public/data/library.json` sample data (replace with the full `library_enriched.json`)
- `pipeline/` the Python data pipeline and enrichment scripts
- `scripts/localize_covers.py` download covers locally
