import * as THREE from "three";

// Per DEMO_SPEC.md §5b: fixed perspective, ~35° elevation. Fully
// stationary — no auto-orbit (Sprint 7 follow-up), camera never moves at
// runtime; only these fixed setup values are tuned.
//
// DISTANCE and LOOK_AT.z were retuned in Sprint 9 (from Sprint 8's 12.5 /
// (0,1,0)) to solve the Floor orientation acceptance test in main.ts
// (left/right corners share screen Y, back/front sit left-/right-of-
// center). That test turned out to have a real mathematical tension: for
// a perfectly Z-symmetric camera (Z=0 position AND Z=0 look-at, as every
// prior sprint used), the two conditions can only coincide exactly at one
// degenerate yaw where the back/front offset is exactly zero — proven both
// analytically (rotating a square's two perpendicular half-diagonals under
// a fixed linear map traces an ellipse pair 90° out of phase, which only
// matches in Y where the X-components are forced to 0) and by exhaustive
// numerical search. A small LOOK_AT.z tilt breaks that symmetry. A
// near-perfect fit exists (score ~0.001) but only at a much closer
// distance (~7-8) that puts the floor's far corner literally behind the
// camera's near plane (invalid projection, real clipping risk) — rejected
// as a degenerate, not-actually-comfortable configuration. This value is
// the best found with every corner confirmed in front of the camera
// (w > 1) and distance left close to Sprint 8's: residual left/right
// mismatch is ~0.10 NDC (~30px at this canvas size, not the "few px" the
// spec describes) — flagged in the sprint log, not hidden.
// DISTANCE raised 12.2 → 26 per explicit request ("zoom out so the
// rectangular plane fits in the screen area"). At 12.2 the floor's FRONT
// corner (nearest the camera) projected at NDC y ≈ -4.47 — wildly
// off-screen — a pre-existing gap from the Sprint 9 solve above (which
// only targeted the left/right/back/front on-screen *conditions* between
// corners, not literally keeping all 4 corners on screen) that the wider
// rectangle floor (see groundPlane.ts's GROUND_SIZE_X) made impossible to
// keep ignoring. Solved empirically: swept DISTANCE from 12 to 34 via a
// temporary live-camera NDC probe (not a hand-derived formula, to avoid
// the transcription-error risk flagged in prior sprints) and picked the
// smallest value giving every corner a comfortable margin inside
// [-1, 1] — 26 gives max |NDC| ≈ 0.82 on the worst (front) corner, ~18%
// margin.
//
// Then brought back in, 26 → 22, per explicit request ("zoom in a bit,
// a small portion of the front corner not being in frame is
// acceptable"). Reused the same swept-distance table from the 26 solve
// above: at 22, the front corner's max |NDC| is ~1.06 — a small, roughly
// 6% overshoot past the [-1, 1] edge (a sliver of that one corner clipped,
// as explicitly authorized), while every other corner stays comfortably
// inside (next-worst is ~0.61). ELEVATION_DEG and LOOK_AT are unchanged
// throughout; both of these were pure zoom adjustments.
const ELEVATION_DEG = 35;
const DISTANCE = 22;
const LOOK_AT = new THREE.Vector3(0, 1.0, -0.3);

export function positionCamera(camera: THREE.PerspectiveCamera): void {
  const elevationRad = THREE.MathUtils.degToRad(ELEVATION_DEG);
  const horizontalDist = DISTANCE * Math.cos(elevationRad);
  const y = DISTANCE * Math.sin(elevationRad);
  camera.position.set(horizontalDist, y, 0);
  camera.lookAt(LOOK_AT);
}
