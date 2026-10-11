// Procedural 3D model helpers. Owner: Person 2.
// Every model in the Lobby and Studio is built in code from boxes, cylinders, spheres and tori,
// so there are no external model files and no licences to track (see docs/ASSETS.md).
import * as THREE from 'three';

export type V3 = [number, number, number];

/** One primitive plus where it sits. `geo` is consumed (disposed) by `compose`. */
export interface Part { geo: THREE.BufferGeometry; pos?: V3; rot?: V3; scale?: V3 }

export const box = (w: number, h: number, d: number, pos: V3 = [0, 0, 0], rot: V3 = [0, 0, 0]): Part =>
  ({ geo: new THREE.BoxGeometry(w, h, d), pos, rot });

export const cyl = (rTop: number, rBot: number, h: number, seg = 10, pos: V3 = [0, 0, 0], rot: V3 = [0, 0, 0]): Part =>
  ({ geo: new THREE.CylinderGeometry(rTop, rBot, h, seg, 1), pos, rot });

export const sph = (r: number, pos: V3 = [0, 0, 0], scale: V3 = [1, 1, 1], seg = 10): Part =>
  ({ geo: new THREE.SphereGeometry(r, seg, Math.max(4, Math.round(seg * 0.7))), pos, scale });

/** Torus lying in the XY plane (rotate it to change that). `arc` < 2π gives an arch. */
export const tor = (R: number, r: number, pos: V3 = [0, 0, 0], rot: V3 = [0, 0, 0], arc = Math.PI * 2, seg = 16): Part =>
  ({ geo: new THREE.TorusGeometry(R, r, 5, seg, arc), pos, rot });

/** A cylinder stretched between two points (rA is the radius at `a`, rB at `b`). Used for limbs, legs and rods. */
export function limb(a: V3, b: V3, rA: number, rB = rA, seg = 6): Part {
  const va = new THREE.Vector3(...a);
  const vb = new THREE.Vector3(...b);
  const dir = vb.clone().sub(va);
  const len = dir.length();
  const mid = va.clone().add(vb).multiplyScalar(0.5);
  const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  const eul = new THREE.Euler().setFromQuaternion(quat);
  return { geo: new THREE.CylinderGeometry(rB, rA, Math.max(len, 1e-4), seg, 1), pos: [mid.x, mid.y, mid.z], rot: [eul.x, eul.y, eul.z] };
}

/** Merge parts into ONE non-indexed, position-only geometry. Keeps draw calls low (one object per model). */
export function compose(parts: Part[]): THREE.BufferGeometry {
  const chunks: Float32Array[] = [];
  let total = 0;
  const matrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const euler = new THREE.Euler();
  for (const p of parts) {
    const g = p.geo.index ? p.geo.toNonIndexed() : p.geo.clone();
    const [px, py, pz] = p.pos ?? [0, 0, 0];
    const [rx, ry, rz] = p.rot ?? [0, 0, 0];
    const [sx, sy, sz] = p.scale ?? [1, 1, 1];
    quat.setFromEuler(euler.set(rx, ry, rz));
    matrix.compose(new THREE.Vector3(px, py, pz), quat, new THREE.Vector3(sx, sy, sz));
    g.applyMatrix4(matrix);
    const arr = new Float32Array((g.getAttribute('position') as THREE.BufferAttribute).array);
    chunks.push(arr);
    total += arr.length;
    g.dispose();
    p.geo.dispose();
  }
  const all = new Float32Array(total);
  let o = 0;
  for (const c of chunks) { all.set(c, o); o += c.length; }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(all, 3));
  return out;
}

/** Small seeded random generator, so point clouds look the same on every visit. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random points on the surface of a non-indexed triangle geometry (area-weighted). Returns x,y,z triples. */
export function samplePoints(geo: THREE.BufferGeometry, count: number, seed = 1): Float32Array {
  const pos = geo.getAttribute('position') as THREE.BufferAttribute;
  const tris = Math.floor(pos.count / 3);
  const out = new Float32Array(Math.max(0, count) * 3);
  if (tris === 0 || count <= 0) return out;
  const a = new THREE.Vector3(); const b = new THREE.Vector3(); const c = new THREE.Vector3();
  const ab = new THREE.Vector3(); const ac = new THREE.Vector3();
  const cum = new Float64Array(tris);
  let sum = 0;
  for (let t = 0; t < tris; t++) {
    a.fromBufferAttribute(pos, t * 3); b.fromBufferAttribute(pos, t * 3 + 1); c.fromBufferAttribute(pos, t * 3 + 2);
    sum += ab.subVectors(b, a).cross(ac.subVectors(c, a)).length() / 2;
    cum[t] = sum;
  }
  if (sum <= 0) return out;
  const rand = rng(seed);
  for (let i = 0; i < count; i++) {
    const target = rand() * sum;
    let lo = 0; let hi = tris - 1;
    while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < target) lo = mid + 1; else hi = mid; }
    a.fromBufferAttribute(pos, lo * 3); b.fromBufferAttribute(pos, lo * 3 + 1); c.fromBufferAttribute(pos, lo * 3 + 2);
    const r1 = Math.sqrt(rand()); const r2 = rand();
    const wa = 1 - r1; const wb = r1 * (1 - r2); const wc = r1 * r2;
    out[i * 3] = a.x * wa + b.x * wb + c.x * wc;
    out[i * 3 + 1] = a.y * wa + b.y * wb + c.y * wc;
    out[i * 3 + 2] = a.z * wa + b.z * wb + c.z * wc;
  }
  return out;
}

/** A unit-radius circle outline in the XZ plane as line segments (scale it to any radius). */
export function circleLines(segments = 64): THREE.BufferGeometry {
  const arr = new Float32Array(segments * 6);
  for (let i = 0; i < segments; i++) {
    const a0 = (i / segments) * Math.PI * 2; const a1 = ((i + 1) / segments) * Math.PI * 2;
    arr.set([Math.cos(a0), 0, Math.sin(a0), Math.cos(a1), 0, Math.sin(a1)], i * 6);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
  return g;
}

/** Flat grid of lines in the XZ plane (width x depth), `cols` x `rows` cells. Used for floor markings. */
export function gridLines(width: number, depth: number, cols: number, rows: number): THREE.BufferGeometry {
  const pts: number[] = [];
  for (let i = 0; i <= cols; i++) { const x = -width / 2 + (i * width) / cols; pts.push(x, 0, -depth / 2, x, 0, depth / 2); }
  for (let j = 0; j <= rows; j++) { const z = -depth / 2 + (j * depth) / rows; pts.push(-width / 2, 0, z, width / 2, 0, z); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(pts), 3));
  return g;
}
