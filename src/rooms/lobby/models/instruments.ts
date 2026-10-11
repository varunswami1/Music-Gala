// Original procedural models for the Lobby and Studio. Owner: Person 2.
// Units are metres, origin on the floor, front of each model faces +z. Part counts are kept small on purpose.
import * as THREE from 'three';
import { box, compose, cyl, limb, sph, tor, type Part, type V3 } from './build';

const TAU = Math.PI * 2;
const HALF = Math.PI / 2;

function piano(): THREE.BufferGeometry {
  const parts: Part[] = [
    box(1.5, 0.22, 1.5, [0, 0.9, -0.2]),                  // case
    box(1.46, 0.05, 0.4, [0, 0.82, 0.74]),                // key bed
    box(1.5, 0.03, 1.3, [0, 1.3, -0.55], [-0.5, 0, 0]),   // raised lid
    box(0.03, 0.4, 0.03, [0.6, 1.15, -0.2]),              // lid prop
    cyl(0.045, 0.035, 0.8, 6, [-0.62, 0.4, 0.6]),
    cyl(0.045, 0.035, 0.8, 6, [0.62, 0.4, 0.6]),
    cyl(0.045, 0.035, 0.8, 6, [0, 0.4, -0.8]),
    box(0.04, 0.3, 0.04, [0, 0.55, 0.62]),                // pedal lyre
    box(0.2, 0.03, 0.06, [0, 0.4, 0.62]),
  ];
  for (let i = 0; i < 14; i++) {
    const x = -0.65 + i * 0.1;
    parts.push(box(0.09, 0.025, 0.34, [x, 0.865, 0.72]));
    if (i < 13 && i % 7 !== 2 && i % 7 !== 6) parts.push(box(0.05, 0.03, 0.2, [x + 0.05, 0.885, 0.66]));
  }
  return compose(parts);
}

function guitar(): THREE.BufferGeometry {
  return compose([
    cyl(0.24, 0.24, 0.1, 16, [0, 0.62, 0], [HALF, 0, 0]),   // lower bout
    cyl(0.18, 0.18, 0.1, 16, [0, 0.9, 0], [HALF, 0, 0]),    // upper bout
    tor(0.07, 0.008, [0, 0.68, 0.052], [0, 0, 0], TAU, 14), // sound hole
    box(0.14, 0.02, 0.03, [0, 0.5, 0.055]),                 // bridge
    box(0.05, 0.8, 0.035, [0, 1.38, 0]),                    // neck
    box(0.075, 0.22, 0.03, [0, 1.9, 0]),                    // headstock
    box(0.012, 1.15, 0.004, [0, 1.2, 0.06]),                // strings
    limb([0, 0.42, -0.03], [0.28, 0, 0.2], 0.012),          // stand
    limb([0, 0.42, -0.03], [-0.28, 0, 0.2], 0.012),
    limb([0, 0.42, -0.03], [0, 0, -0.3], 0.012),
  ]);
}

function violin(): THREE.BufferGeometry {
  return compose([
    sph(1, [0, 0.98, 0], [0.11, 0.14, 0.03], 12),           // lower bout
    sph(1, [0, 1.18, 0], [0.085, 0.11, 0.03], 12),          // upper bout
    box(0.03, 0.3, 0.025, [0, 1.46, 0]),                    // neck
    tor(0.025, 0.006, [0, 1.64, 0], [0, 0, 0], TAU, 10),    // scroll
    box(0.006, 0.7, 0.004, [0, 1.25, 0.035]),               // strings
    cyl(0.012, 0.012, 0.8, 6, [0, 0.4, 0]),                 // rod
    cyl(0.14, 0.14, 0.015, 14, [0, 0.01, 0]),               // base
  ]);
}

function turntable(): THREE.BufferGeometry {
  return compose([
    box(0.9, 0.9, 0.7, [0, 0.45, 0]),                        // plinth
    box(0.84, 0.05, 0.62, [0, 0.925, 0]),                    // deck
    cyl(0.26, 0.26, 0.02, 24, [-0.06, 0.96, 0]),             // platter
    cyl(0.24, 0.24, 0.012, 24, [-0.06, 0.975, 0]),           // record
    cyl(0.07, 0.07, 0.014, 12, [-0.06, 0.98, 0]),            // label
    cyl(0.03, 0.03, 0.05, 8, [0.33, 0.975, -0.2]),           // tonearm pivot
    limb([0.33, 1.0, -0.2], [0.09, 1.0, 0.12], 0.007),       // tonearm
  ]);
}

function headphones(): THREE.BufferGeometry {
  return compose([
    tor(0.17, 0.012, [0, 0, 0], [0, 0, 0], Math.PI, 20),     // band
    cyl(0.08, 0.08, 0.05, 14, [-0.17, 0, 0], [0, 0, HALF]),  // ear cups
    cyl(0.08, 0.08, 0.05, 14, [0.17, 0, 0], [0, 0, HALF]),
    tor(0.07, 0.01, [-0.2, 0, 0], [0, HALF, 0], TAU, 14),    // pads
    tor(0.07, 0.01, [0.2, 0, 0], [0, HALF, 0], TAU, 14),
  ]);
}

/** A vinyl record shown edge-on-ish: concentric grooves and a label, floats in the Lobby. */
function record(): THREE.BufferGeometry {
  const parts: Part[] = [tor(0.07, 0.006, [0, 0, 0], [HALF, 0, 0], TAU, 16)];
  for (const r of [0.14, 0.2, 0.26, 0.32, 0.38]) parts.push(tor(r, 0.003, [0, 0, 0], [HALF, 0, 0], TAU, 36));
  return compose(parts);
}

function tabla(): THREE.BufferGeometry {
  return compose([
    cyl(0.14, 0.15, 0.28, 16, [-0.2, 0.17, 0]),               // bayan
    tor(0.14, 0.008, [-0.2, 0.31, 0], [HALF, 0, 0], TAU, 18),
    tor(0.15, 0.02, [-0.2, 0.02, 0], [HALF, 0, 0], TAU, 18),
    cyl(0.075, 0.11, 0.32, 16, [0.12, 0.19, 0]),              // dayan
    tor(0.075, 0.008, [0.12, 0.35, 0], [HALF, 0, 0], TAU, 16),
    tor(0.11, 0.02, [0.12, 0.02, 0], [HALF, 0, 0], TAU, 16),
  ]);
}

function harmonium(): THREE.BufferGeometry {
  const parts: Part[] = [
    box(0.64, 0.2, 0.4, [0, 0.18, 0]),                        // case
    box(0.64, 0.03, 0.4, [0, 0.31, 0]),                       // lid
    box(0.05, 0.08, 0.05, [-0.28, 0.04, 0.15]),               // feet
    box(0.05, 0.08, 0.05, [0.28, 0.04, 0.15]),
  ];
  for (let i = 0; i < 12; i++) parts.push(box(0.034, 0.02, 0.14, [-0.22 + i * 0.04, 0.3, 0.26])); // keys
  for (let i = 0; i < 3; i++) parts.push(box(0.62, 0.17 - i * 0.02, 0.04, [0, 0.2 - i * 0.01, -0.22 - i * 0.06])); // bellows
  return compose(parts);
}

function tanpura(): THREE.BufferGeometry {
  return compose([
    sph(1, [0, 0.3, 0], [0.2, 0.2, 0.2], 14),                 // gourd
    tor(0.12, 0.015, [0, 0.1, 0], [HALF, 0, 0], TAU, 14),     // ring stand
    cyl(0.025, 0.03, 1.4, 8, [0, 1.15, 0]),                   // neck
    box(0.07, 0.14, 0.04, [0, 1.92, 0]),                      // head
    box(0.05, 0.012, 0.012, [-0.05, 1.88, 0]),                // pegs
    box(0.05, 0.012, 0.012, [0.05, 1.92, 0]),
    box(0.05, 0.012, 0.012, [-0.05, 1.96, 0]),
    box(0.05, 0.012, 0.012, [0.05, 2.0, 0]),
    box(0.006, 1.5, 0.004, [0, 1.15, 0.03]),                  // strings
  ]);
}

/** Microphone stand with a boom pointing to -z (towards the singer) and a pop filter. `h` is the boom height. */
function micStandAt(h: number): THREE.BufferGeometry {
  const len = h - 0.05;
  return compose([
    cyl(0.2, 0.2, 0.02, 16, [0, 0.01, 0]),
    cyl(0.012, 0.012, len, 6, [0, 0.025 + len / 2, 0]),
    limb([0, h, 0], [0, h + 0.04, -0.4], 0.01),
    cyl(0.025, 0.025, 0.1, 8, [0, h + 0.04, -0.42], [HALF, 0, 0]),
    sph(1, [0, h + 0.04, -0.48], [0.032, 0.032, 0.032], 8),
    tor(0.09, 0.004, [0, h + 0.06, -0.3], [0, 0, 0], TAU, 20),
  ]);
}
const micStand = () => micStandAt(1.6);
const micStandLow = () => micStandAt(1.36);

/** Round-topped stool like the one in the reference pictures. */
function stool(): THREE.BufferGeometry {
  return compose([
    cyl(0.2, 0.2, 0.04, 12, [0, 0.47, 0]),
    limb([0.13, 0.45, 0.08], [0.22, 0, 0.13], 0.012),
    limb([-0.13, 0.45, 0.08], [-0.22, 0, 0.13], 0.012),
    limb([0, 0.45, -0.14], [0, 0, -0.24], 0.012),
    tor(0.17, 0.008, [0, 0.2, 0.01], [HALF, 0, 0], TAU, 14),
  ]);
}

/** A hall column: shaft, base and capital. Drawn mostly as points, like the columns in the lobby reference. */
function column(): THREE.BufferGeometry {
  return compose([
    cyl(0.28, 0.32, 5.5, 14, [0, 3, 0]),
    box(0.9, 0.25, 0.9, [0, 0.125, 0]),
    tor(0.4, 0.05, [0, 0.35, 0], [HALF, 0, 0], TAU, 18),
    tor(0.36, 0.05, [0, 5.7, 0], [HALF, 0, 0], TAU, 18),
    box(0.9, 0.25, 0.9, [0, 5.9, 0]),
  ]);
}

/** Pinboard with eight small frames, for the studio wall (front faces +z). */
function board(): THREE.BufferGeometry {
  const parts: Part[] = [box(4.2, 2.2, 0.04)];
  for (const y of [-0.52, 0.52]) for (let i = 0; i < 4; i++) parts.push(box(0.7, 0.9, 0.02, [-1.5 + i, y, 0.03]));
  return compose(parts);
}

function speaker(): THREE.BufferGeometry {
  return compose([
    box(0.3, 0.44, 0.28, [0, 1.12, 0]),
    tor(0.1, 0.008, [0, 1.05, 0.142], [0, 0, 0], TAU, 16),
    tor(0.06, 0.006, [0, 1.05, 0.142], [0, 0, 0], TAU, 14),
    tor(0.03, 0.006, [0, 1.26, 0.142], [0, 0, 0], TAU, 10),
    box(0.26, 0.015, 0.24, [0, 0.9, 0]),
    cyl(0.02, 0.02, 0.9, 6, [0, 0.45, 0]),
    cyl(0.18, 0.18, 0.015, 12, [0, 0.01, 0]),
  ]);
}

/** One section of a mixing desk. The control surface slopes down towards the operator (+z). */
function consoleSection(channels: number): THREE.BufferGeometry {
  const tilt = 0.2;
  const w = channels * 0.16 + 0.4;
  const slab = (x: number, zl: number, lift: number): V3 =>
    [x, 0.8 + lift * Math.cos(tilt) - zl * Math.sin(tilt), lift * Math.sin(tilt) + zl * Math.cos(tilt)];
  const parts: Part[] = [
    box(w, 0.7, 0.9, [0, 0.35, 0]),
    box(w, 0.06, 0.7, [0, 0.8, 0], [tilt, 0, 0]),
    box(w, 0.2, 0.08, [0, 1.0, -0.4]),                                                     // meter bridge
  ];
  for (let i = 0; i < channels; i++) {
    const x = -((channels - 1) * 0.08) + i * 0.16;
    parts.push(box(0.016, 0.01, 0.2, slab(x, 0.18, 0.035), [tilt, 0, 0]));                 // fader slot
    parts.push(box(0.03, 0.02, 0.04, slab(x, 0.1 + (i % 5) * 0.03, 0.05), [tilt, 0, 0]));  // fader cap
    for (let r = 0; r < 3; r++) parts.push(cyl(0.018, 0.018, 0.02, 6, slab(x, -0.08 - r * 0.07, 0.04), [tilt, 0, 0])); // knobs
    if (i % 2 === 0) parts.push(tor(0.05, 0.004, [x, 1.0, -0.35], [0, 0, 0], TAU, 10));    // VU meter
  }
  return compose(parts);
}

/** A proper studio desk: 3-part curved mixing console, two rack towers, two screens, keyboard and an operator chair. */
function consoleDesk(): THREE.BufferGeometry {
  const parts: Part[] = [
    { geo: consoleSection(16) },
    { geo: consoleSection(8), pos: [-2.236, 0, 0.365], rot: [0, 0.45, 0] },
    { geo: consoleSection(8), pos: [2.236, 0, 0.365], rot: [0, -0.45, 0] },
  ];
  for (const s of [-1, 1]) {
    const x = s * 4.1;
    parts.push(box(0.8, 1.7, 0.7, [x, 0.85, 0.1]));                                       // rack tower
    for (let i = 0; i < 9; i++) {
      const y = 0.3 + i * 0.17;
      parts.push(box(0.7, 0.12, 0.02, [x, y, 0.46]));                                     // rack unit
      parts.push(cyl(0.025, 0.025, 0.02, 6, [x + 0.2, y, 0.47], [HALF, 0, 0]));           // knob
      parts.push(box(0.04, 0.02, 0.02, [x - 0.25, y, 0.47]));                             // light
    }
  }
  for (const x of [-0.8, 0.8]) {
    parts.push(box(0.95, 0.56, 0.04, [x, 1.6, -0.6]));                                    // screen
    parts.push(limb([x, 1.32, -0.6], [x, 0.98, -0.5], 0.02));                             // stand
  }
  parts.push(box(0.55, 0.02, 0.18, [0, 0.84, 0.2], [0.2, 0, 0]));                        // keyboard
  parts.push(box(0.55, 0.07, 0.55, [0, 0.55, 1.5]));                                      // chair seat
  parts.push(box(0.55, 0.65, 0.07, [0, 0.92, 1.78]));                                     // chair back
  parts.push(cyl(0.03, 0.03, 0.4, 6, [0, 0.33, 1.5]));
  for (let k = 0; k < 5; k++) {
    const a = (k * TAU) / 5;
    parts.push(limb([0, 0.12, 1.5], [0.3 * Math.cos(a), 0.04, 1.5 + 0.3 * Math.sin(a)], 0.02));
  }
  return compose(parts);
}

function synth(): THREE.BufferGeometry {
  const parts: Part[] = [
    box(1.1, 0.06, 0.3, [0, 0.85, 0]),
    limb([-0.4, 0.84, 0], [-0.55, 0, 0.12], 0.012),
    limb([-0.4, 0.84, 0], [-0.55, 0, -0.12], 0.012),
    limb([0.4, 0.84, 0], [0.55, 0, 0.12], 0.012),
    limb([0.4, 0.84, 0], [0.55, 0, -0.12], 0.012),
  ];
  for (let i = 0; i < 22; i++) parts.push(box(0.04, 0.02, 0.14, [-0.462 + i * 0.044, 0.885, 0.07]));
  return compose(parts);
}

/** Acoustic panels around the studio wall (local origin = the room's centre, wall radius 14.6). */
function panels(): THREE.BufferGeometry {
  const R = 14.6;
  const parts: Part[] = [];
  for (let deg = -120; deg <= 120; deg += 8) {
    if (Math.abs(deg) < 42) continue;                          // keep clear of the booth
    if (Math.abs(deg) > 70 && Math.abs(deg) < 106) continue;   // room for the pinboard and the screen
    const th = (deg * Math.PI) / 180;
    for (const y of [1.5, 3.9]) parts.push(box(1.4, 2.0, 0.1, [R * Math.sin(th), y, -R * Math.cos(th)], [0, -th, 0]));
  }
  return compose(parts);
}

/** Half sphere used as the studio dome (draw with edgeAngle ~1 and squash it with scale). */
function dome(): THREE.BufferGeometry {
  return compose([{ geo: new THREE.SphereGeometry(9, 24, 8, 0, TAU, 0, HALF) }]);
}

/** Hanging ring lights and the big cone lamp over the mixing desk. */
function lights(): THREE.BufferGeometry {
  const parts: Part[] = [];
  for (const [x, z] of [[-6, -3], [6, -3], [-8, -9], [8, -9]] as const) {
    parts.push(tor(0.8, 0.02, [x, 5.0, z], [HALF, 0, 0], TAU, 28));
    parts.push(cyl(0.005, 0.005, 1.8, 4, [x, 5.9, z]));
  }
  parts.push(cyl(0.06, 0.7, 0.45, 16, [0, 4.5, -9.2]));
  parts.push(cyl(0.005, 0.005, 1.5, 4, [0, 5.5, -9.2]));
  return compose(parts);
}

/** A single hanging cone lamp (origin at the lamp). */
function coneLamp(): THREE.BufferGeometry {
  return compose([cyl(0.06, 0.5, 0.34, 14), cyl(0.004, 0.004, 0.9, 4, [0, 0.62, 0])]);
}

/** Sound-absorbing foam wedges on a flat wall: 12 columns x 5 rows, points toward +z. */
function foam(): THREE.BufferGeometry {
  const parts: Part[] = [];
  for (let i = 0; i < 12; i++) for (let r = 0; r < 5; r++) parts.push(cyl(0, 0.3, 0.3, 4, [-3.85 + i * 0.7, 0.7 + r * 0.75, 0], [HALF, 0, 0]));
  return compose(parts);
}

/** The vocal booth shell, local origin at the centre of the glass wall: 9 m wide, 4.5 m tall, 6.5 m deep towards -z. */
function boothShell(): THREE.BufferGeometry {
  return compose([
    box(9, 4.5, 0.12, [0, 2.25, -6.5]),
    box(0.12, 4.5, 6.5, [-4.5, 2.25, -3.25]),
    box(0.12, 4.5, 6.5, [4.5, 2.25, -3.25]),
    box(9.12, 0.12, 6.5, [0, 4.5, -3.25]),
    box(9, 0.06, 6.5, [0, 0.03, -3.25]),
  ]);
}

/** Tall arched windows along a hall wall (local origin on the wall, windows face +x or -x). */
function windowRow(): THREE.BufferGeometry {
  const parts: Part[] = [];
  for (const z of [2, -6, -22, -30]) {
    parts.push(box(0.12, 4.8, 2.8, [0, 3.1, z]));
    parts.push(box(0.16, 4.2, 2.2, [0, 3.1, z]));
    parts.push(box(0.1, 4.2, 0.06, [0, 3.1, z]));
    parts.push(box(0.1, 0.06, 2.2, [0, 3.6, z]));
    parts.push(tor(1.4, 0.05, [0, 5.5, z], [0, HALF, 0], Math.PI, 24));
  }
  return compose(parts);
}

/** Roof trusses for the lobby hall (20 m wide, walls 8.4 m, ridge 12.6 m, from z=14 to z=-50). */
function roof(): THREE.BufferGeometry {
  const parts: Part[] = [];
  for (const z of [8, -2, -12, -22, -32, -42]) {
    parts.push(limb([-10, 8.4, z], [0, 12.6, z], 0.05, 0.05, 4));
    parts.push(limb([10, 8.4, z], [0, 12.6, z], 0.05, 0.05, 4));
    parts.push(limb([-10, 8.4, z], [10, 8.4, z], 0.03, 0.03, 4));
    parts.push(limb([0, 8.4, z], [0, 12.6, z], 0.03, 0.03, 4));
  }
  for (const x of [-10, -5, 0, 5, 10]) parts.push(limb([x, x === 0 ? 12.6 : 8.4 + (10 - Math.abs(x)) * 0.42, 14], [x, x === 0 ? 12.6 : 8.4 + (10 - Math.abs(x)) * 0.42, -50], 0.04, 0.04, 4));
  return compose(parts);
}

export interface PersonPose {
  /** Each arm is [shoulder, elbow, hand], written for a standing figure. */
  left: [V3, V3, V3];
  right: [V3, V3, V3];
  headX: number;
  width: number;
  height: number;
  /** Sitting on a stool: the body drops and the legs go forward. */
  seated?: boolean;
}

/**
 * A figure made of tapered limbs, with headphones. `part` is the torso/legs/head ('body') or one arm ('left' / 'right').
 * An arm is built around its own shoulder joint, so it can be rotated about the shoulder to wave.
 */
function buildPerson(p: PersonPose, part: 'body' | 'left' | 'right'): THREE.BufferGeometry {
  const hx = p.headX;
  const dy = p.seated ? -0.3 : 0;
  const up = (v: V3): V3 => [v[0], v[1] + dy, v[2]];
  let parts: Part[];
  if (part === 'body') {
    parts = [
      sph(1, up([hx, 1.68, 0]), [0.095, 0.12, 0.1], 10),                        // head
      cyl(0.04, 0.045, 0.1, 6, up([hx * 0.5, 1.53, 0])),                        // neck
      limb(up([-0.2, 1.45, 0]), up([0.2, 1.45, 0]), 0.045),                     // shoulders
      { ...cyl(0.17, 0.14, 0.62, 10, up([0, 1.15, 0])), scale: [1, 1, 0.62] as V3 }, // torso
      sph(1, up([0, 0.82, 0]), [0.16, 0.1, 0.1], 8),                            // pelvis
      tor(0.12, 0.01, up([hx, 1.7, 0]), [0, 0, 0], Math.PI, 16),                // headphone band
      cyl(0.045, 0.045, 0.03, 8, up([hx - 0.115, 1.68, 0]), [0, 0, HALF]),      // ear cups
      cyl(0.045, 0.045, 0.03, 8, up([hx + 0.115, 1.68, 0]), [0, 0, HALF]),
    ];
    for (const s of [-1, 1]) {
      if (p.seated) {
        parts.push(limb([0.09 * s, 0.52, 0], [0.1 * s, 0.52, 0.4], 0.07, 0.06));      // thigh, forward
        parts.push(limb([0.1 * s, 0.52, 0.4], [0.1 * s, 0.08, 0.43], 0.055, 0.04));   // shin, down
        parts.push(box(0.08, 0.05, 0.2, [0.1 * s, 0.03, 0.5]));                       // foot
      } else {
        parts.push(limb([0.09 * s, 0.8, 0], [0.1 * s, 0.45, 0.02], 0.07, 0.06));
        parts.push(limb([0.1 * s, 0.45, 0.02], [0.1 * s, 0.06, 0], 0.055, 0.04));
        parts.push(box(0.08, 0.05, 0.2, [0.1 * s, 0.03, 0.05]));
      }
    }
  } else {
    const arm = part === 'left' ? p.left : p.right;
    const o = up(arm[0]);
    const rel = (v: V3): V3 => { const u = up(v); return [u[0] - o[0], u[1] - o[1], u[2] - o[2]]; };
    parts = [
      limb(rel(arm[0]), rel(arm[1]), 0.04, 0.035),
      limb(rel(arm[1]), rel(arm[2]), 0.035, 0.03),
      sph(1, rel(arm[2]), [0.04, 0.045, 0.04], 6),
    ];
  }
  const g = compose(parts);
  g.scale(p.width, p.height, p.width);
  return g;
}

/** Where an arm's shoulder joint sits (after the figure's width/height scaling), for placing a rotating arm group. */
export function shoulderOf(p: PersonPose, side: 'left' | 'right'): V3 {
  const a = side === 'left' ? p.left : p.right;
  const dy = p.seated ? -0.3 : 0;
  return [a[0][0] * p.width, (a[0][1] + dy) * p.height, a[0][2] * p.width];
}

// Somay: sits on a stool, right hand to the headphones, left hand resting on the knee.
export const SOMAY: PersonPose = {
  headX: 0.01, width: 1, height: 1, seated: true,
  left: [[-0.2, 1.45, 0], [-0.3, 1.17, 0.1], [-0.2, 0.9, 0.34]],
  right: [[0.2, 1.45, 0], [0.34, 1.3, 0.02], [0.16, 1.62, 0.05]],
};
// Varun: one arm out in an expressive gesture, the other relaxed.
export const VARUN: PersonPose = {
  headX: -0.015, width: 1.08, height: 1.04,
  left: [[-0.2, 1.45, 0], [-0.4, 1.38, 0.1], [-0.58, 1.62, 0.2]],
  right: [[0.2, 1.45, 0], [0.3, 1.17, 0.02], [0.22, 0.95, 0.08]],
};

export const BUILDERS = {
  piano, guitar, violin, turntable, headphones, record,
  tabla, harmonium, tanpura, micStand, micStandLow, stool, column, board, speaker, consoleDesk, synth, panels, lights, dome, coneLamp, foam, boothShell, windowRow, roof,
  somay: () => buildPerson(SOMAY, 'body'),
  somayL: () => buildPerson(SOMAY, 'left'),
  somayR: () => buildPerson(SOMAY, 'right'),
  varun: () => buildPerson(VARUN, 'body'),
  varunL: () => buildPerson(VARUN, 'left'),
  varunR: () => buildPerson(VARUN, 'right'),
} satisfies Record<string, () => THREE.BufferGeometry>;

export type ModelKind = keyof typeof BUILDERS;
