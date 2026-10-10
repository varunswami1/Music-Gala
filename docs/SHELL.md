# Shell and engine (Person 1)

What the shell gives every room, and what it will not break. Rooms never need to edit shell files.

## Shared components (stable API: props are only ever added, never renamed)
| Piece | Use | Notes |
|---|---|---|
| `useRoomCamera(position, lookAt, parallax?, opts?)` | Call once per Scene | Adds drag-to-look, scroll-to-move, the room-change push and reduced motion on top. `opts` (e.g. `{ move: false }`) overrides the room's camera profile |
| `Poster` | Covers, portraits, cards | Pass `onOpen` or `onDoubleOpen` to make it keyboard-openable (double-open wins) |
| `Door` | Every room-to-room link | `onOpen` is the click and the Enter action |
| `WireBox`, `WireCylinder` | Room outlines | Geometry disposed on unmount |
| `useHover(label, onActivate?, name?)` | Custom 3D objects | `onActivate` makes the object keyboard-reachable; `hover` is also true while it has keyboard focus |
| `useHint(text)` | Bottom hint line | Unchanged |
| `useApp(s => s.go)` | Navigate from 3D code | Unchanged |
| `useReducedMotion()` | Skip your own animation | Live; mirrors the OS setting |
| `useApp(s => s.quality)` | `'high' \| 'low'` | Low = no mirror floor, fewer particles. Starts low on touch; an FPS guard lowers it if frames stay under ~40 fps |

## Camera
- **Drag to look** (mouse button or one finger), **scroll to move** (wheel, ArrowUp/Down, two-finger pinch). Movement slides along the room's own view direction and is clamped per room (`ROOM_PROFILES` in `world/cameraInput.ts`).
- **Card-ring room has scroll-to-move off** because the wheel and arrows rotate the ring. Drag-to-look works there with a full turn.
- Only the 3D area reacts. HTML panels (lyrics, lists, menu) scroll on their own and never move the world.
- If your room uses the wheel or arrows, call `useRoomCamera(..., { move: false })` (or ask for a profile line).

## Keyboard
- **Tab** reaches the room's objects as one stop (a hidden list of real buttons). **Arrow keys / Home / End** move between objects and are not passed on to room shortcuts. **Enter or Space** opens.
- **Enter with the mouse over an object** opens it (when no control has focus).
- The focused object lights up in 3D and its name shows above the hint line.
- No shortcut fires while typing or while the lyrics panel has focus (`ui/keys.ts`, `isTypingTarget`; mark any other panel `data-no-shortcuts`).

## Transitions
Route change = quick fade to black while the camera pushes forward and the FOV widens, the scene and panels swap behind black, then a slower fade in with the camera gliding into place. The scene and panels switch together (`useTransitionedPath`). Reduced motion: instant switch, no push.

## Atmosphere
Stars, dust motes (one draw call), fog 9 to 42, dark mirror floor. Look values (fog, particle size) were tuned by reasoning, not by eye: adjust in `world/Atmosphere.tsx` and `WorldCanvas.tsx`.

## Menu and tabs
MENU is a numbered world-map drawer (Escape closes, focus is trapped and returned, current room marked, scene rooms read from `library.json`). Bottom-left room tabs follow the reference lobby. BACK never leaves the app: on the first page of a session it goes to the Lobby.

## Mobile / touch plan
Done now: no custom cursor on touch, one-finger drag and pinch, bigger tap targets, `touch-action: none` on the 3D area, low quality by default, panels become top and bottom bands under 900 px wide, guide wording for touch.
Next (Phase 3): the flat 2D list fallback for weak devices, a bottom sheet for long panels, `viewport-fit=cover` plus `theme-color` in `index.html` (not in Person 1's list, so left alone), testing on a real phone.

## Not verified yet
`npm install` could not run where this was written, so `npm run typecheck`, `npm run dev` and the browser acceptance checks were NOT run. See CHANGELOG.md for what was and was not checked. Run the pure-logic checks with `npx tsx src/world/shell.check.ts`.
