import * as THREE from "three";
import "./style.css";
import { createScene } from "./scene";
import { positionCamera } from "./cameraRig";
import { createGroundPlane, GROUND_SIZE_X, GROUND_SIZE_Z } from "./groundPlane";
import { createSubject } from "./subject";
import { createRadarSweep } from "./radarSweep";
import { createRipples } from "./ripples";
import { createContinuousRipples } from "./continuousRipples";
import { createHud, updateHud } from "./hud";
import { pollEvents } from "./api";
import type { DetectionEvent } from "./types";

const app = document.querySelector<HTMLDivElement>("#app")!;
app.innerHTML = `
  <div id="scene-container"></div>
  <div id="hud-root"></div>
`;

const sceneCtx = createScene(
  document.querySelector<HTMLDivElement>("#scene-container")!,
);
const { scene, camera } = sceneCtx;

positionCamera(camera);

// Per DEMO_SPEC.md §5b "Floor orientation": the floor (and everything on
// it) is rotated about world Y so a corner faces the camera (two-point
// perspective), tuned so the LEFT/RIGHT corners share screen Y and
// BACK/FRONT sit left-of-/right-of-center. The camera itself is never
// touched here or in the render loop — only this group's fixed
// orientation, set once. Solved empirically (see cameraRig.ts's doc
// comment for the full story, including the mathematical tension found
// between the two acceptance conditions and why this value is a
// deliberate compromise, not a perfect fit).
const FLOOR_ROTATION_DEG = 46.7;
const worldGroup = new THREE.Group();
worldGroup.rotation.y = THREE.MathUtils.degToRad(FLOOR_ROTATION_DEG);
scene.add(worldGroup);

const ground = createGroundPlane();
worldGroup.add(ground.group);

// Subject sits ~75% of the way toward a back floor corner, in the floor's
// own local space (i.e. before the worldGroup rotation above is applied).
const SUBJECT_CORNER_FRACTION = 0.75;
const subjectPosition = new THREE.Vector3(
  -(GROUND_SIZE_X / 2) * SUBJECT_CORNER_FRACTION,
  0,
  -(GROUND_SIZE_Z / 2) * SUBJECT_CORNER_FRACTION,
);
const subject = createSubject(subjectPosition);
worldGroup.add(subject.group);

// The sweep represents the elevated scanning source's own rotating beam,
// so it lies flat at that elevated height (one subject-height above the
// subject's base), not at ground level.
const scanningSourcePosition = subjectPosition
  .clone()
  .setY(subjectPosition.y + subject.height);
const radarSweep = createRadarSweep(scanningSourcePosition);
worldGroup.add(radarSweep.group);

// Ripple death radius, per DEMO_SPEC.md §5b's Ripple system: the distance
// from the subject's base to the floor's LEFT corner — the corner that
// reads as "left" on screen for the fixed camera above, not a hand-picked
// local coordinate (§9 bugfix: the previous hardcoded LEFT_CORNER_LOCAL
// happened to be correct here, but was fragile against any future retune
// of FLOOR_ROTATION_DEG/camera framing — this picks it by actually
// projecting all 4 floor corners through the real camera and taking the
// smallest screen-space X). Distance between two points in the same rigid
// (rotated) group is rotation-invariant, so the result is independent of
// FLOOR_ROTATION_DEG regardless of which corner is picked. Also used as
// the continuous scanning pulse's death radius below, so both ripple
// systems reach the same maximum scale. The floor is a rectangle
// (GROUND_SIZE_X != GROUND_SIZE_Z), so X and Z half-extents are computed
// separately rather than sharing one `half`.
worldGroup.updateMatrixWorld(true);
camera.updateMatrixWorld(true);
const halfX = GROUND_SIZE_X / 2;
const halfZ = GROUND_SIZE_Z / 2;
const floorCornersLocal = [
  new THREE.Vector3(-halfX, 0, -halfZ),
  new THREE.Vector3(-halfX, 0, halfZ),
  new THREE.Vector3(halfX, 0, -halfZ),
  new THREE.Vector3(halfX, 0, halfZ),
];
let leftCornerLocal = floorCornersLocal[0];
let leftCornerNdcX = Infinity;
for (const corner of floorCornersLocal) {
  const ndcX = worldGroup.localToWorld(corner.clone()).project(camera).x;
  if (ndcX < leftCornerNdcX) {
    leftCornerNdcX = ndcX;
    leftCornerLocal = corner;
  }
}
const rippleDeathRadius = subjectPosition.distanceTo(leftCornerLocal);
const ripples = createRipples(subjectPosition, rippleDeathRadius);
worldGroup.add(ripples.group);

// Always-on ambient pulse from the scanning source, irrespective of
// DetectionEvent.status — distinct from the detection-gated floor Ripple
// system above. Shares the same death radius as the floor ripples (full
// scene scale) so both reach a visually consistent maximum size. Centered
// a bit lower than the sweep's exact scanning-source height, per explicit
// request — its own origin, not shared with the sweep.
const PULSE_ORIGIN_LOWER_FRACTION = 0.3; // of subject.height
const pulseOriginPosition = scanningSourcePosition
  .clone()
  .setY(scanningSourcePosition.y - subject.height * PULSE_ORIGIN_LOWER_FRACTION);
const continuousRipples = createContinuousRipples(pulseOriginPosition, rippleDeathRadius);
worldGroup.add(continuousRipples.group);

createHud(document.querySelector<HTMLDivElement>("#hud-root")!);

let latestEvent: DetectionEvent | null = null;
pollEvents((event) => {
  latestEvent = event;
  updateHud(event);
});

const timer = new THREE.Timer();
function animate(): void {
  requestAnimationFrame(animate);
  timer.update();
  const delta = timer.getDelta();
  const status = latestEvent?.status ?? "idle";

  radarSweep.update(delta, status);
  ripples.update(delta, status);
  continuousRipples.update(delta);
  subject.update(delta, latestEvent);
  ground.update(subject.position, latestEvent?.confidence ?? 0);

  sceneCtx.render();
}
animate();
