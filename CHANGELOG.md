# Changelog

All notable changes from each team member across all phases are documented below.

## Iteration 2 (October 11, 2026): Architectural Realism & Visual Overhaul

### Interactive Archive Room (`/archive`)
- Full interactive 3D and 2D chronicler room added at `/archive`.
- 3D space with floating timeline monoliths representing Phase 0, Iteration 1, and Iteration 2.
- 2D panels with tabbed epoch selector, role-by-role changes breakdown, and "Before vs After" comparison cards for each room.
- Maintained as a living record for all future updates.

### Shell v1.1 (Person 1)
- **Unified Wireframe Outlines:** `WireBox` and `WireCylinder` render in crisp architectural white across all rooms.
- **360° Wrap-Around Camera:** Rooms surround the camera origin (box depth 28 centred on z=0), enabling full panoramic look-around (`maxYaw = Math.PI`).
- **Flush Door Placement:** Doors sit flush on walls (side doors rotated 90°, front doors at z=-13.8, round room doors along circle perimeter) with bright vertical posts.
- **Custom Disc Cursor:** Fine white dot that expands into a white disc with contextual label (`OPEN`, `ENTER`) over interactive objects, following with a soft lag.
- **Dynamic Scramble-Text Hint Bar:** Bottom hint line scrambles in object names on hover (`CLICK / ENTER TO OPEN`).
- **Streamlined Menu:** Thinner and more spacious world-map drawer navigation.

### Lobby & Studio v2 (Person 2)
- **Grand Lobby Hall:** Monumental 20m wide x 64m long hall featuring roof trusses, tall windows, 12 dotted columns, and floating 2x scale instruments.
- **30m Studio with Vocal Booth:** Dedicated recording booth behind a glass wall with dotted walls, foam insulation, and entrance door.
- **Animated Point-Cloud Singers:** Somay seated on stool, Varun standing at mic—breathing, swaying, and moving their arms.
- **Walking Controls:** `useWalk.ts` enables W/S/A/D keyboard walk and trackpad scroll navigation (forward is -z). Two-finger pinch-zoom blocked.
- **Hardware Props:** 3-piece mixing desk, dual monitors, equipment rack towers, and operator chair.
- **Atmosphere:** Extended fog distance (14 to 95) for long hall visibility.

### Heaven, Library, Playlists & Card Ring v2 (Person 3)
- **3D Gate Corridor:** Replaced floating frames with a deep 3D corridor featuring large alternating room portals.
- **Multi-Layered Card Ring:** Albums-behind-albums cylinder ring: ↑/↓ shifts between front and back layers, ←/→ rotates, G toggles grouping (artist / year / all). Double-click opens song; clicking back card brings layer forward.
- **Top Navigation Bar:** Persistent header (`HEAVEN · LIBRARY · PLAYLISTS · TASTE · DISCOVER · ARCHIVE`) with breadcrumbs and active room indicator.
- **Library-Wide Search:** Press `/` or click top-left search to search within current room or across all 10,402 songs, flying matching cards forward.
- **Zoom Lock:** Pinch and gesture zoom locked for a steady perspective.

### Song & Artist Rooms v2 (Person 4)
- **Pure Black & White Aesthetic:** Removed color tints, glowing floor rings, and colored borders for an authentic architectural look.
- **3x Scale Artwork:** Hanging cover (9 units) in Song Room and artist portrait (7.2x9) in Artist Room dominate the space.
- **110° Side Doors:** Positioned to the left and right outside initial view, reachable via mouse drag look-around or arrow keys (`useLookCamera.ts`).
- **Seamless Ambient Audio Drone:** Added `public/audio/ambient.mp3` (80-second looping drone), automatically fading out when YouTube song playback starts.

### Taste, Discover & Warp Transitions v2 (Person 5)
- **Taste Room Redesign:** Grand piano with open lid, violin stand, turntable, and 4 dot-cloud audience figures.
- **Skyline Equalizer & Canvases:** Release year equalizer skyline on back wall and top-4 artist landscape canvas frames (`CanvasFrame.tsx`) with cover-collage fallback.
- **Cinematic Warp Transition:** Door click triggers zoom into door, rush through line/dot tunnel overlay (`Warp.tsx`, `TransitionDirector.tsx`), and smooth arrival into destination room.
- **Optimized Discover Doors:** Positioned doors to sides, removing the previous camera blockage.

---

## Iteration 1 (October 10, 2026): Core Loop & Full Data Merge

### Data Layer & Full Library (Person 5)
- 10,402 songs and 5,303 artists imported into `public/data/library.json`.
- 98 enriched artist biographies and profiles in `public/data/artists.json`.
- 6,680 individual lyrics files in `public/data/lyrics/`.
- Validation and parsing scripts with 15/15 passing tests.

### Song Playback & Details (Person 4)
- Official YouTube embedded IFrame player with seekable progress and volume.
- Scrollable synchronized lyrics with credit attribution.
- Similar songs recommendation strip (From Library / New tabs).

### Scene Ring & Playlists (Person 3)
- Initial cylindrical card ring grouping up to 54 cards per cluster.
- Playlist frames reading source playlist metadata.

### Shell & World Canvas (Person 1)
- Persistent R3F Canvas with room plugin system.
- Shared primitives: `Door`, `Poster`, `WireBox`, `WireCylinder`.
- Custom cursor and interaction guide overlays.
- Contract v1 frozen (`src/contract/routes.ts`).

### Initial Lobby & Studio (Person 2)
- Wireframe instrument models and circular recording studio.
