// Shared camera input state: drag-to-look, scroll-to-move and the room-change "push". Owner: Person 1.
// Pure TypeScript (no React, no three.js) so it can be checked on its own: see shell.check.ts.
// Input handlers (useCameraInput) write the *Target values; stepCamera() eases the live values once per frame;
// useRoomCamera reads the live values. Rooms never touch this file directly.

export interface CameraProfile {
  drag: boolean;      // drag-to-look allowed
  move: boolean;      // scroll-to-move allowed (turn off where the wheel already means something, e.g. the card ring)
  moveMin: number;    // how far back / forward the camera may travel along the room's view direction (world units)
  moveMax: number;
  maxYaw: number;     // radians of left/right look (Infinity = full turn)
  maxPitch: number;   // radians of up/down look
}

export const DEFAULT_PROFILE: CameraProfile = { drag: true, move: true, moveMin: -1, moveMax: 4, maxYaw: 1.25, maxPitch: 0.5 };

/** Per-room tuning, keyed by RoomDef.id. A room can also override at runtime: useRoomCamera(..., { move: false }). */
export const ROOM_PROFILES: Record<string, Partial<CameraProfile>> = {
  lobby: { moveMax: 6 },
  studio: { moveMax: 5 },
  heaven: { moveMax: 7 },
  library: { moveMax: 7 },
  'library-room': { move: false, maxYaw: Infinity, maxPitch: 0.8 }, // wheel rotates the card ring; the camera sits in the middle
  song: { moveMax: 3 },
  artist: { moveMax: 3 },
};

export const PUSH_OUT = 2.4;   // metres the camera glides forward while the room fades out
export const PUSH_IN = 1.6;    // metres behind its resting spot the camera starts in the next room

export const cam = {
  roomId: null as string | null,
  profile: { ...DEFAULT_PROFILE } as CameraProfile,
  overrides: [] as Partial<CameraProfile>[],
  // live (eased) values, read every frame
  yaw: 0, pitch: 0, move: 0, push: 0,
  // targets, written by input
  yawTarget: 0, pitchTarget: 0, moveTarget: 0, pushTarget: 0,
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

function recompute() {
  let p: CameraProfile = { ...DEFAULT_PROFILE, ...(cam.roomId ? ROOM_PROFILES[cam.roomId] : undefined) };
  for (const o of cam.overrides) p = { ...p, ...o };
  cam.profile = p;
  cam.yawTarget = clamp(cam.yawTarget, -p.maxYaw, p.maxYaw);
  cam.pitchTarget = clamp(cam.pitchTarget, -p.maxPitch, p.maxPitch);
  cam.moveTarget = p.move ? clamp(cam.moveTarget, p.moveMin, p.moveMax) : 0;
}

/** Called by WorldCanvas whenever the shown room changes: picks that room's profile and recentres the view. */
export function setCameraRoom(roomId: string | null) {
  cam.roomId = roomId;
  cam.yaw = cam.yawTarget = cam.pitch = cam.pitchTarget = cam.move = cam.moveTarget = 0;
  recompute();
}

/** Room-level override (used by useRoomCamera's 4th argument). Returns an undo function. Survives room changes correctly. */
export function overrideProfile(patch: Partial<CameraProfile>): () => void {
  cam.overrides.push(patch);
  recompute();
  return () => {
    const i = cam.overrides.indexOf(patch);
    if (i >= 0) cam.overrides.splice(i, 1);
    recompute();
  };
}

/** Pointer drag in CSS pixels. Dragging right turns the view left (the world follows the pointer). */
export function dragBy(dx: number, dy: number) {
  const p = cam.profile;
  if (!p.drag) return;
  cam.yawTarget = clamp(cam.yawTarget + dx * 0.0045, -p.maxYaw, p.maxYaw);
  cam.pitchTarget = clamp(cam.pitchTarget + dy * 0.0035, -p.maxPitch, p.maxPitch);
}

/** Wheel in CSS pixels (deltaMode already normalised). Scrolling down moves forward. Returns false when the room ignores it. */
export function wheelBy(deltaY: number): boolean {
  const p = cam.profile;
  if (!p.move) return false;
  cam.moveTarget = clamp(cam.moveTarget + deltaY * 0.006, p.moveMin, p.moveMax);
  return true;
}

/** Two-finger pinch: positive = fingers moving apart = move forward. */
export function pinchBy(deltaPx: number): boolean {
  const p = cam.profile;
  if (!p.move) return false;
  cam.moveTarget = clamp(cam.moveTarget + deltaPx * 0.02, p.moveMin, p.moveMax);
  return true;
}

export function setPushTarget(v: number) { cam.pushTarget = v; }
/** Jump the push to `v` (hidden behind the black fade) and let it ease back to its target. */
export function kickPush(v: number) { cam.push = v; }

/** Ease live values toward their targets. Called once per frame by the CameraRig inside the canvas. */
export function stepCamera(dt: number, reduced: boolean) {
  const d = Math.min(Math.max(dt, 0), 0.1);
  const k = reduced ? 1 : 1 - Math.exp(-d * 10);
  const kp = reduced ? 1 : 1 - Math.exp(-d * 5);
  cam.yaw += (cam.yawTarget - cam.yaw) * k;
  cam.pitch += (cam.pitchTarget - cam.pitch) * k;
  cam.move += (cam.moveTarget - cam.move) * k;
  cam.push += (cam.pushTarget - cam.push) * kp;
}
