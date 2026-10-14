// Placement helpers for round rooms: the camera stands at the centre, everything is placed by compass angle and distance.
// 0° is straight ahead (-z), positive angles turn to the right, 180° is directly behind.
import { faceTowards } from './Door';

export const polar = (deg: number, r: number): [number, number] => { const a = (deg * Math.PI) / 180; return [Math.sin(a) * r, -Math.cos(a) * r]; };
/** Yaw that makes an object at compass (deg, r) face the centre of the room. */
export const yawToCenter = (deg: number, r: number) => { const [x, z] = polar(deg, r); return faceTowards(x, z); };
