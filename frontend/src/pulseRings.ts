import * as THREE from "three";
import type { DetectionEvent } from "./types";
import { ALERT_ACCENT_HEX } from "./palette";

// Per DEMO_SPEC.md §5a: 3 staggered rings, shared 1.8s loop, offset 0.6s
// apart, each scaling 0.4x -> 2.2x while fading opacity 0.7 -> 0. Only
// visible while status is "detected" or "escalated".
const RING_COUNT = 3;
const LOOP_S = 1.8;
const STAGGER_S = 0.6;
const SCALE_START = 0.4;
const SCALE_END = 2.2;
const OPACITY_START = 0.7;
const OPACITY_END = 0;
const BASE_RADIUS = 1;
const STROKE_WIDTH = 0.04;

export interface PulseRings {
  group: THREE.Group;
  update(deltaSeconds: number, status: DetectionEvent["status"]): void;
}

export function createPulseRings(): PulseRings {
  const geometry = new THREE.RingGeometry(
    BASE_RADIUS - STROKE_WIDTH / 2,
    BASE_RADIUS + STROKE_WIDTH / 2,
    48,
  );

  const rings: THREE.Mesh[] = [];
  const group = new THREE.Group();
  for (let i = 0; i < RING_COUNT; i++) {
    const material = new THREE.MeshBasicMaterial({
      color: ALERT_ACCENT_HEX,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    rings.push(mesh);
    group.add(mesh);
  }

  let elapsedS = 0;

  function update(deltaSeconds: number, status: DetectionEvent["status"]): void {
    const active = status === "detected" || status === "escalated";
    elapsedS += deltaSeconds;

    for (let i = 0; i < RING_COUNT; i++) {
      const mesh = rings[i];
      mesh.visible = active;
      if (!active) continue;

      const phase = ((elapsedS + i * STAGGER_S) % LOOP_S) / LOOP_S;
      const scale = THREE.MathUtils.lerp(SCALE_START, SCALE_END, phase);
      const opacity = THREE.MathUtils.lerp(OPACITY_START, OPACITY_END, phase);

      mesh.scale.setScalar(scale);
      (mesh.material as THREE.MeshBasicMaterial).opacity = opacity;
    }
  }

  return { group, update };
}
