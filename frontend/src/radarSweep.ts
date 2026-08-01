import * as THREE from "three";
import type { DetectionEvent } from "./types";
import { ALERT_ACCENT_HEX, IDLE_ACCENT_HEX } from "./palette";

// Per DEMO_SPEC.md §5a: flat ~35° wedge, clockwise, full rotation every 3s,
// runs in all states. No trail/fade — a single flat translucent wedge.
const ARC_DEGREES = 35;
const ROTATION_PERIOD_S = 3;
const SWEEP_RADIUS = 3.0;

const IDLE_COLOR = new THREE.Color(IDLE_ACCENT_HEX);
const ALERT_COLOR = new THREE.Color(ALERT_ACCENT_HEX);
const IDLE_OPACITY = 0.08;
const ALERT_OPACITY = 0.12;

export interface RadarSweep {
  mesh: THREE.Mesh;
  update(deltaSeconds: number, status: DetectionEvent["status"]): void;
}

export function createRadarSweep(): RadarSweep {
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

  function update(deltaSeconds: number, status: DetectionEvent["status"]): void {
    // Camera looks down -z, so a visually clockwise sweep needs decreasing rotation.z.
    mesh.rotation.z -= (deltaSeconds / ROTATION_PERIOD_S) * Math.PI * 2;

    const alert = status === "detected" || status === "escalated";
    material.color.copy(alert ? ALERT_COLOR : IDLE_COLOR);
    material.opacity = alert ? ALERT_OPACITY : IDLE_OPACITY;
  }

  return { mesh, update };
}
