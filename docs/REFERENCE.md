# Reference pack

**Reference site:** https://virtuallyeverafter.xyz (an architect-led studio's immersive 3D site: Lobby, Works hall, About office, Archive).
We borrow the **mood and the interaction ideas only**. We do not copy its name, logo, script wordmark, texts, models, point-cloud figures or code.
The original screen recordings are large (about 570 MB). Keep them in a shared drive for people to watch. **Do not upload them to AI assistants:
this folder and the descriptions below replace them.**

## Screenshots (in docs/reference/)
| File | What it shows | We use it for |
|---|---|---|
| 05-lobby | Wireframe hall, columns, big screen at the end, signs on doors ("STUDIO", "WORKS"), reflective floor, bottom hint line, bottom-left room tabs, bottom-right CONTROLS / SOUND | Our Lobby and Heaven; hall shape, doors with floating labels, bottom hint line |
| 04-gallery-hall | Long dark hall, framed pictures hanging at different depths, category row at the top, point-cloud visitors, round white "OPEN" cursor | Heaven and Library: frames in depth, category row, cursor label |
| 02-door-works-hall | A white doorway frame with the label "WORKS HALL" and its reflection | Our doors (Door component) and BACK TO LIBRARY door |
| 03-song-room-reference | A single work shown as a big hanging picture, thin frame, cables to the ceiling, left info panel, right text, giant outline word behind | **Song Room** layout: cover instead of the red painting |
| 01-interaction-guide | Blurred scene with three instructions (move forward, rotate view, click or Enter to open) and CLOSE | First-visit guide. Only show instructions we implemented |
| 06-office-board | A glowing screen on a desk, a paper, a monitor, a lamp, props | Studio and Taste props style |
| 07-studio-figure-reference, 08-props-and-figure | A person made of white points sitting on a stool; wireframe walls, door, pinboard | Singers behind the glass in the Studio (point-cloud figures) |
| 09 / 10 tastemap-ring-keep | Cards on the inside of a wide cylinder, in colour groups | **The only thing kept from the old prototype:** the card-ring layout for scene rooms. Ignore its colours, player bar and header |

## Behaviours seen in the videos (not in the screenshots)
- **Intro:** a dark loader with spaced-out title text and a rotating line-art emblem, then an aerial view of a wireframe building with a white round LAUNCH button. Clicking steps you inside.
- **Rooms are separate scenes** joined by doors. Each has its own camera and a short bottom sentence telling you what to do.
- **Works room:** a field of drifting particles with the category names across the top; scroll moves you through; clicking opens one piece.
- **Archive:** a plain list of big category words that expand to show small cards.
- **Header on every screen:** BACK (left), wordmark (centre), MENU (right). Bottom-left: tabs of the main rooms. Bottom-right: CONTROLS, SOUND.
- **Cursor:** a small bright dot; on interactive things it becomes a larger white circle with a word such as OPEN.
- **Text:** monospace, uppercase, very wide letter spacing, thin lines, no boxes.

## What is ours, not theirs
Name and wordmark; room names (Heaven, Library, scene rooms such as The Cinema); the card-ring scene rooms; the Song and Artist rooms with lyrics and discography;
music content and data; all 3D models (use CC0 or licensed ones and list them in docs/ASSETS.md); all text and code.

## How an AI assistant should use this
Open the screenshot that matches your room, describe what you borrow in one sentence, then build it with our shared components.
Never ask for the videos. If something is unclear, ask the person, do not guess the reference.
