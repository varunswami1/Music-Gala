import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { HOLD, IN, OUT, clamp01, easeInOut, easeOut, tx } from './transition';

const m4 = new THREE.Matrix4(), up = new THREE.Vector3(0, 1, 0), tmp = new THREE.Vector3();
const goalPos = new THREE.Vector3(), goalQuat = new THREE.Quaternion();
const BASE_FOV = 60;

/** Lives inside the persistent Canvas. Drives the camera while a door transition runs (zoom in, then a stretched-FOV arrival). */
export function TransitionDirector() {
  useFrame(({ camera }) => {
    const cam = camera as THREE.PerspectiveCamera;
    const now = performance.now();
    let fov = BASE_FOV;
    if (tx.phase === 'out') {
      if (!tx.captured) {
        tx.captured = true; tx.startPos.copy(cam.position); tx.startQuat.copy(cam.quaternion); tx.startFov = cam.fov;
      }
      const e = easeInOut(clamp01((now - tx.t0) / OUT));
      if (tx.door) {
        tmp.copy(tx.door).sub(tx.startPos); tmp.y = 0; if (tmp.lengthSq() < 1e-4) tmp.set(0, 0, -1); tmp.normalize();
        goalPos.copy(tx.door).addScaledVector(tmp, -1.0); goalPos.y = THREE.MathUtils.lerp(tx.startPos.y, tx.door.y, 0.5);
        m4.lookAt(goalPos, tx.door, up); goalQuat.setFromRotationMatrix(m4);
      } else {                                                  // no door clicked (a poster, a panel): push straight ahead
        tmp.set(0, 0, -1).applyQuaternion(tx.startQuat); tmp.y = 0; tmp.normalize();
        goalPos.copy(tx.startPos).addScaledVector(tmp, 4); goalQuat.copy(tx.startQuat);
      }
      cam.position.lerpVectors(tx.startPos, goalPos, e);
      cam.quaternion.slerpQuaternions(tx.startQuat, goalQuat, clamp01(e * 1.5));
      fov = THREE.MathUtils.lerp(tx.startFov, 34, e);
    } else if (tx.phase === 'hold') {
      fov = 100;
    } else if (tx.phase === 'in') {
      fov = THREE.MathUtils.lerp(100, BASE_FOV, easeOut(clamp01((now - tx.t0) / IN)));
    }
    if (Math.abs(cam.fov - fov) > 0.01) { cam.fov = fov; cam.updateProjectionMatrix(); }
  });
  void HOLD;
  return null;
}
