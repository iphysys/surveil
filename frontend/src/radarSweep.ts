import * as THREE from "three";
import type { DetectionEvent } from "./types";
import { ALERT_ACCENT_HEX, STRUCTURE_ACCENT_HEX } from "./palette";

// Per DEMO_SPEC.md §5a/§5b: flat ~35° wedge, clockwise, full rotation every
// 3s, runs in all states, now lying flat on the floor and rotating about
// the subject rather than billboarded to the camera.
const ARC_DEGREES = 35;
const ROTATION_PERIOD_S = 3;
const SWEEP_RADIUS = 5;
const FLOOR_Y_OFFSET = 0.002;

const IDLE_COLOR = new THREE.Color(STRUCTURE_ACCENT_HEX);
const ALERT_COLOR = new THREE.Color(ALERT_ACCENT_HEX);
const IDLE_OPACITY = 0.08;
const ALERT_OPACITY = 0.12;

export interface RadarSweep {
  group: THREE.Group;
  update(deltaSeconds: number, status: DetectionEvent["status"]): void;
}

export function createRadarSweep(position: THREE.Vector3): RadarSweep {
  const geometry = new THREE.CircleGeometry(
    SWEEP_RADIUS,
    24,
    0,
    THREE.MathUtils.degToRad(ARC_DEGREES),
  );
  const material = new THREE.MeshBasicMaterial({
    color: IDLE_COLOR,
    transparent: true,
    opacity: IDLE_OPACITY,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2; // lay flat on the floor plane (static)

  const group = new THREE.Group();
  group.position.set(position.x, position.y + FLOOR_Y_OFFSET, position.z);
  group.add(mesh);

  function update(deltaSeconds: number, status: DetectionEvent["status"]): void {
    // Elevated camera looks generally downward; positive rotation.y reads
    // counter-clockwise from that vantage, so decrement for a clockwise sweep.
    group.rotation.y -= (deltaSeconds / ROTATION_PERIOD_S) * Math.PI * 2;

    const alert = status === "detected" || status === "escalated";
    material.color.copy(alert ? ALERT_COLOR : IDLE_COLOR);
    material.opacity = alert ? ALERT_OPACITY : IDLE_OPACITY;
  }

  return { group, update };
}
