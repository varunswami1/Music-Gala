# Design: Music Gallery

## 1. Vision
A dark, cinematic virtual gallery. Songs, albums and artists are physical objects (framed covers, doors, cards)
inside connected rooms. You move through one world, not between web pages. Inspired in mood by a studio site
we liked (dark wireframe space, point-cloud figures, monospace labels). We borrow the mood only: all models,
layouts, names and text are our own.

Words: dark, wireframe, monospace, quiet, spatial, album art as the only colour.

## 2. World map
```
Lobby ──► Studio ──┐
  │                ▼
  └──────────► HEAVEN (main hub)
                 ├─ Taste        your listening, compiled
                 ├─ Library      one frame per scene ──► scene room (cylinder of card clusters) ──► Song Room ──► Artist Room
                 ├─ Discover     recommendations from outside your library
                 ├─ Playlists    your own playlists as frames (open like Library)
                 └─ Archive      effort and progress record (designed later)
```
Core loop (must work first): **Heaven → Library → scene room → Song Room → Artist Room → another Song Room → back to Library.**

## 3. Rooms
| Room | Purpose | Key content | Phase |
|---|---|---|---|
| Lobby | Explain the site, set the mood | Title, tagline, 3D instrument models, doors to Studio and Heaven | 2 |
| Studio | Bollywood-style recording studio in a dome | Instruments and props, singers (Somay, Varun) in a booth behind glass, doors to Lobby and Heaven | 2 |
| Heaven | Main gallery hub | Hanging frames to Taste, Library, Discover, Playlists; door to Archive; drifting covers | 1 |
| Library | Scene overview | One hanging frame per scene room, with song count and cover collage | 1 |
| Scene room | Browse songs | Wide cylinder of card clusters: wheel or arrows rotate, up/down switch cluster, hover pops a card with title and artist, double-click opens the Song Room | 1 |
| Song Room | One song | Centre: cover as a hanging artwork. Left: title, artist (clickable), album, year, scrollable lyrics. Right: artist panel with VIEW ARTIST. Door: BACK TO LIBRARY | 1 |
| Artist Room | One artist | Centre: portrait. Left: details. Right: scrollable clickable discography. Doors: back to library, back to previous song | 1 |
| Taste | Compilation of listening | Top artists, scenes, years. Piano and violin props, themed background | 2 |
| Discover | New songs for you | Recommendations from outside the library, each with a reason, "From library / New" toggle | 2 |
| Playlists | Your own collections | Hanging frames, one per playlist (give them proper names; raw names like "Mix2" tell nothing) | 2 |
| Archive | Progress record | Separate; design later | 3 |

Scene rooms (from the data pipeline): The Cinema (Hindi film), The Terrace (Punjabi), The Underpass (desi hip-hop, global wing),
The Skyline (English and international), The Greenroom (indie pop), The Courtyard (folk and regional), The Cellar (unsorted).
The Dome (favourites) and The Roll Call (artists) are views over the same data.

## 4. Visual language
- Black background, thin white lines, restrained star particles, subtle fog, dark reflective floor.
- Covers bring the only colour. Optionally tint a room's light from the cover's dominant colour.
- Typography: monospace, uppercase, wide letter spacing for labels. Clean sans for big headings.
- Every room shares: header (BACK / wordmark / MENU), custom cursor, bottom-right controls, bottom hint line, fade transition.
- No dashboard cards or heavy UI boxes. Text panels are plain, thin-lined, editorial.

## 5. Interaction rules
- Custom cursor: bright dot, ring and a short label on interactive things (OPEN, BACK TO LIBRARY, song title). Default cursor on touch devices.
- Only show instructions for interactions that exist. Currently implemented: look around (mouse), click to open, wheel/arrows in the card ring.
- Keyboard shortcuts must never fire while typing or while the lyrics panel has focus.
- Lyrics and discography scroll independently and never move the 3D world.
- Every missing thing (song, artist, cover, lyrics, audio) shows a calm placeholder, never a crash.

## 6. Audio
- Ambient loop: optional, off by default, starts only after a click, fades in and out, low volume. Separate from song playback.
- Song playback: official YouTube embedded player only, one at a time, switching replaces the previous song. Never extract audio.
- Do not claim something is playing when it is not.

## 7. Content and legal
- Lyrics: only from a licensed or authorised source (check each API's terms; many free tiers return only a snippet). Never scrape, never invent.
- 3D models: free CC0 or properly licensed models, shown as wireframe or point clouds so everything shares one look. Keep a list of sources and licences in `docs/ASSETS.md` (create it).
- Covers, artist photos and bios come from public metadata sources. Check their terms before any public release. This is a personal, unpublished project.

## 8. Performance and accessibility
- 60 fps on a normal laptop. Card ring: draw only one cluster at a time (54 cards); use instancing before going higher.
- Lazy-load textures. Keep particle counts low. Respect `prefers-reduced-motion`.
- A flat 2D fallback list for mobile and weak devices is planned (Phase 3). Keep text contrast high and focus outlines visible.

## 9. Kept from the earlier TasteMap prototype
Only the **cylindrical card ring** look (cards on the inside of a wide cylinder, clustered, rotating). Nothing else (no player bar, no
Taste DNA page, no 2D grid) carries over.
