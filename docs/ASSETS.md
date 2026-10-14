# Assets: sources and licences

## 3D models (Lobby and Studio, Person 2)
There are **no external model files**. Every instrument, prop and figure is generated in code from boxes, cylinders,
spheres and tori (`src/rooms/lobby/models/instruments.ts`) and drawn as an outline and/or a point cloud.
Nothing was downloaded, traced or adapted from another model, so there is no third-party licence to honour.

| Model | Used in | Made by |
|---|---|---|
| Piano, guitar, violin, turntable, headphones, vinyl record, drum kit, cello, saxophone, bench, vinyl rack, amp stack, sofa, stairs, arch | Lobby and Studio | Procedural, original |
| Mixing desk, studio monitors, microphone stands, ring lights, acoustic panels, dome | Studio | Procedural, original |
| Tabla, harmonium, tanpura, keyboard | Studio | Procedural, original (simplified shapes) |
| Singer figures (Somay seated, Varun standing), stool, pinboard, columns | Lobby and Studio | Procedural, original (tapered limbs, sampled to points) |

If a downloaded CC0 or licensed model is ever added, add a row here first: name, source URL, author, licence, date.

## Fonts
The 3D text uses drei's `Text`, which loads its default font at runtime. Check that font's licence before any public release.
