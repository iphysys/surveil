import * as THREE from "three";
import type { DetectionEvent } from "./types";
import { ALERT_ACCENT_HEX } from "./palette";

// Per DEMO_SPEC.md §5b "Ripple system" — water-wave rings expanding from
// the subject's base, dying exactly at `deathRadius` (the distance from
// the subject to the floor's left corner, computed by the caller since
// that depends on the floor's yaw/geometry, not anything this module
// knows about). Supersedes the old §5a pulse rings (deleted, not reused).
const EMIT_INTERVAL_S = 1.4;
// Target ripple lifetime is "~2.5-3s" per spec; speed is derived from
// deathRadius / LIFE_S below so life stays in that range regardless of
// what deathRadius numerically works out to be for this scene's geometry.
const LIFE_S = 2.75;
const OPACITY_START = 0.6;
const STROKE_WIDTH = 0.05; // constant world-space ring width as it expands
const SEGMENTS = 64;
const FLOOR_Y_OFFSET = 0.003;

interface Ripple {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  radius: number;
}

export interface Ripples {
  group: THREE.Group;
  update(deltaSeconds: number, status: DetectionEvent["status"]): void;
}

function ringGeometryAt(radius: number): THREE.RingGeometry {
  const inner = Math.max(0.001, radius - STROKE_WIDTH / 2);
  const outer = radius + STROKE_WIDTH / 2;
  return new THREE.RingGeometry(inner, outer, SEGMENTS);
}

export function createRipples(position: THREE.Vector3, deathRadius: number): Ripples {
  const group = new THREE.Group();
  group.position.set(position.x, position.y + FLOOR_Y_OFFSET, position.z);

  const speed = deathRadius / LIFE_S;
  const ripples: Ripple[] = [];
  let emitTimer = 0;
  let lastStatus: DetectionEvent["status"] | null = null;

  function spawnRipple(): void {
    const material = new THREE.MeshBasicMaterial({
      color: ALERT_ACCENT_HEX,
      transparent: true,
      opacity: OPACITY_START,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new THREE.Mesh(ringGeometryAt(0), material);
    mesh.rotation.x = -Math.PI / 2; // lay flat on the floor plane
    group.add(mesh);
    ripples.push({ mesh, material, radius: 0 });
  }

  function removeRipple(index: number): void {
    const ripple = ripples[index];
    group.remove(ripple.mesh);
    ripple.mesh.geometry.dispose();
    ripple.material.dispose();
    ripples.splice(index, 1);
  }

  function clearRipples(): void {
    for (let i = ripples.length - 1; i >= 0; i--) removeRipple(i);
  }

  function update(deltaSeconds: number, status: DetectionEvent["status"]): void {
    if (status !== lastStatus) {
      lastStatus = status;
      // Defensive — normal timing already drains ripples well before idle
      // (life ~2.75s vs. resolved-hold's 3s), but the spec is explicit
      // that idle must show none, so enforce it directly rather than rely
      // on timing coincidence.
      if (status === "idle") clearRipples();
    }

    const active = status === "detected" || status === "escalated";
    if (active) {
      emitTimer -= deltaSeconds;
      if (emitTimer <= 0) {
        spawnRipple();
        emitTimer = EMIT_INTERVAL_S;
      }
    }

    // Existing ripples keep expanding/fading regardless of `active` — on
    // resolved they finish naturally, per spec, they just stop being
    // replenished.
    for (let i = ripples.length - 1; i >= 0; i--) {
      const ripple = ripples[i];
      ripple.radius += speed * deltaSeconds;

      if (ripple.radius >= deathRadius) {
        removeRipple(i);
        continue;
      }

      const oldGeometry = ripple.mesh.geometry;
      ripple.mesh.geometry = ringGeometryAt(ripple.radius);
      oldGeometry.dispose();
      ripple.material.opacity = THREE.MathUtils.lerp(OPACITY_START, 0, ripple.radius / deathRadius);
    }
  }

  return { group, update };
}
