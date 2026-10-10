// Plain-TypeScript checks for the shell's pure logic (no browser, no React). Owner: Person 1.
// Run:  npx tsx src/world/shell.check.ts      (exits with an error if any check fails)
import {
  cam, dragBy, kickPush, overrideProfile, pinchBy, setCameraRoom, setPushTarget, stepCamera, wheelBy, DEFAULT_PROFILE,
} from './cameraInput';
import {
  activateHovered, getInteractives, registerInteractive, setHoveredInteractive, setFocusedInteractive, getFocusedInteractive,
  subscribeInteractives, updateInteractiveLabel,
} from './interactive';

let failed = 0;
const check = (name: string, ok: boolean) => { if (!ok) failed++; console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}`); };

async function main() {
  // --- camera ---
  setCameraRoom('heaven');
  wheelBy(100000);
  check('scroll-to-move is clamped to the room max', cam.moveTarget === 7);
  wheelBy(-100000);
  check('scroll-to-move is clamped to the room min', cam.moveTarget === DEFAULT_PROFILE.moveMin);
  dragBy(100000, 100000);
  check('drag yaw/pitch are clamped', cam.yawTarget === DEFAULT_PROFILE.maxYaw && cam.pitchTarget === DEFAULT_PROFILE.maxPitch);
  setCameraRoom('library-room');
  check('card-ring room: wheel is left to the ring', wheelBy(500) === false && cam.moveTarget === 0);
  check('card-ring room: pinch is ignored too', pinchBy(500) === false);
  dragBy(100000, 0);
  check('card-ring room: full-turn drag is allowed', cam.yawTarget > 100);
  setCameraRoom('song');
  const undo = overrideProfile({ move: false });
  check('room override turns scroll-to-move off', wheelBy(100) === false);
  setCameraRoom('heaven'); // room change while the override is still registered (old scene unmounts later)
  check('override survives a room change until it is undone', wheelBy(100) === false);
  undo();
  check('undo restores the room profile', wheelBy(100) === true);
  setCameraRoom('song');
  check('room change recentres the view', cam.move === 0 && cam.yaw === 0 && cam.pitch === 0);
  dragBy(50, 0); wheelBy(100);
  stepCamera(0.016, true);
  check('reduced motion: live values snap to targets', cam.yaw === cam.yawTarget && cam.move === cam.moveTarget);
  setCameraRoom('song'); dragBy(50, 0);
  stepCamera(0.016, false);
  check('normal motion: eases (moves some, not all, of the way)', cam.yaw > 0 && cam.yaw < cam.yawTarget);
  setPushTarget(2.4); kickPush(-1.6);
  for (let i = 0; i < 120; i++) stepCamera(1 / 60, false);
  check('push eases to its target after a kick', Math.abs(cam.push - 2.4) < 0.01);
  setPushTarget(0);

  // --- interactive registry ---
  let notified = 0;
  const off = subscribeInteractives(() => { notified++; });
  let opened = '';
  const un1 = registerInteractive({ id: 'a', label: 'A', activate: () => { opened = 'a'; } });
  const un2 = registerInteractive({ id: 'b', label: 'B', activate: () => { opened = 'b'; } });
  for (let i = 0; i < 52; i++) registerInteractive({ id: 'c' + i, label: 'C', activate: () => {} });
  await Promise.resolve();
  check('a burst of 54 registrations notifies once', notified === 1 && getInteractives().length === 54);
  check('registration order is kept', getInteractives()[0].id === 'a' && getInteractives()[1].id === 'b');
  setHoveredInteractive('b');
  check('Enter opens the hovered object', activateHovered() === true && opened === 'b');
  un2();
  check('an unmounted object cannot be opened by Enter', activateHovered() === false);
  updateInteractiveLabel('a', 'Renamed');
  await Promise.resolve();
  check('label update is visible without re-registering', getInteractives()[0].label === 'Renamed' && getInteractives()[0].id === 'a');
  un1();
  await Promise.resolve();
  check('unregister removes the object', !getInteractives().some((i) => i.id === 'a'));
  setFocusedInteractive('c3');
  check('focus id is tracked', getFocusedInteractive() === 'c3');
  setFocusedInteractive(null);
  off();

  console.log(failed ? `\n${failed} check(s) FAILED` : '\nAll shell checks passed');
  if (failed) throw new Error('shell checks failed');
}
main();
