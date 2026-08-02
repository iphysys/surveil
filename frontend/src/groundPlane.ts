import * as THREE from "three";
import { ALERT_ACCENT_HEX, STRUCTURE_ACCENT_HEX } from "./palette";
import { SUBJECT_HEIGHT } from "./subject";

// Per DEMO_SPEC.md §5b: dark floor at y=0 with a ~64x64 grid of dots
// (brighter base than the original "subtle" description); a radial
// threat-color tint falls off from the subject's position — red within
// ~2x "subject radius", fading to the structure color beyond that, scaled
// by confidence. Implemented as a single THREE.Points cloud (one draw
// call) rather than THREE.InstancedMesh — visually equivalent for flat
// dots and far cheaper; "instanced points" is read as "many point
// instances", not the stricter InstancedMesh API.
//
// "~2x subject radius" is read here as 2x the subject's overall height
// (a legible falloff on this scene's scale) rather than the capsule's own
// ~0.25-unit cross-sectional radius, which would make the tint nearly
// invisible against the floor — flagged as an interpretation choice.
//
// The floor is a rectangle, not a square: GROUND_SIZE_X (the edge running
// back-corner-to-right-corner, and its parallel front-to-left edge) was
// lengthened from the original 12-unit square per explicit request;
// GROUND_SIZE_Z (the other pair of edges) is unchanged. No exact target
// length was given — 18 (50% longer) was a tuned choice, flagged here.
export const GROUND_SIZE_X = 18;
export const GROUND_SIZE_Z = 12;
// Dot spacing is derived from GROUND_SIZE_Z at a baseline density, then
// applied uniformly along X too (rather than a fixed index count) so the
// grid reads as evenly spaced dots on a rectangle, not a stretched square
// grid. Baseline halved (64 → 32) per explicit request for a less dense
// grid — roughly doubles the spacing between dots.
const GRID_COUNT_Z = 32;
const DOT_SPACING = GROUND_SIZE_Z / GRID_COUNT_Z;
const GRID_COUNT_X = Math.round(GROUND_SIZE_X / DOT_SPACING);
const TINT_FALLOFF_RADIUS = SUBJECT_HEIGHT * 2;
// Pure black per explicit request (was a very-dark blue-gray, 0x0c0f15).
const FLOOR_COLOR = 0x000000;
const DOT_Y_OFFSET = 0.001;
const DOT_BASE_BRIGHTNESS = 0.55; // fraction of structure color; raised from Sprint 5's ~0.3-equivalent dimness

const DOT_BASE_COLOR = new THREE.Color(STRUCTURE_ACCENT_HEX).multiplyScalar(
  DOT_BASE_BRIGHTNESS,
);
const THREAT_TINT_COLOR = new THREE.Color(ALERT_ACCENT_HEX);

export interface GroundPlane {
  group: THREE.Group;
  update(subjectPosition: THREE.Vector3, confidence: number): void;
}

export function createGroundPlane(): GroundPlane {
  const group = new THREE.Group();

  const floorGeometry = new THREE.PlaneGeometry(GROUND_SIZE_X, GROUND_SIZE_Z);
  const floorMaterial = new THREE.MeshBasicMaterial({ color: FLOOR_COLOR });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  group.add(floor);

  const dotCount = GRID_COUNT_X * GRID_COUNT_Z;
  const positions = new Float32Array(dotCount * 3);
  const colors = new Float32Array(dotCount * 3);
  const dotXZ: { x: number; z: number }[] = new Array(dotCount);

  let idx = 0;
  for (let i = 0; i < GRID_COUNT_X; i++) {
    for (let j = 0; j < GRID_COUNT_Z; j++) {
      const x = -GROUND_SIZE_X / 2 + DOT_SPACING * (i + 0.5);
      const z = -GROUND_SIZE_Z / 2 + DOT_SPACING * (j + 0.5);
      positions[idx * 3] = x;
      positions[idx * 3 + 1] = DOT_Y_OFFSET;
      positions[idx * 3 + 2] = z;
      colors[idx * 3] = DOT_BASE_COLOR.r;
      colors[idx * 3 + 1] = DOT_BASE_COLOR.g;
      colors[idx * 3 + 2] = DOT_BASE_COLOR.b;
      dotXZ[idx] = { x, z };
      idx++;
    }
  }

  const dotGeometry = new THREE.BufferGeometry();
  dotGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  const colorAttr = new THREE.BufferAttribute(colors, 3);
  dotGeometry.setAttribute("color", colorAttr);

  const dotMaterial = new THREE.PointsMaterial({
    size: 0.04,
    vertexColors: true,
    transparent: true,
    opacity: 0.85,
    sizeAttenuation: true,
  });
  const dots = new THREE.Points(dotGeometry, dotMaterial);
  group.add(dots);

  const tmpColor = new THREE.Color();

  function update(subjectPosition: THREE.Vector3, confidence: number): void {
    for (let i = 0; i < dotCount; i++) {
      const { x, z } = dotXZ[i];
      const dx = x - subjectPosition.x;
      const dz = z - subjectPosition.z;
      const dist = Math.sqrt(dx * dx + dz * dz);
      const falloff = Math.max(0, 1 - dist / TINT_FALLOFF_RADIUS);
      const blend = falloff * confidence;
      tmpColor.copy(DOT_BASE_COLOR).lerp(THREAT_TINT_COLOR, blend);
      colorAttr.setXYZ(i, tmpColor.r, tmpColor.g, tmpColor.b);
    }
    colorAttr.needsUpdate = true;
  }

  return { group, update };
}
