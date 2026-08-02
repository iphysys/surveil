import * as THREE from "three";
import { CONTINUOUS_PULSE_HEX } from "./palette";

// An always-on pulse from the elevated scanning source's own position —
// distinct from the detection-triggered floor Ripple system in ripples.ts
// (which stays gated to detected/escalated). This one runs in every
// state, irrespective of DetectionEvent.status.
//
// 5 concentric fixed "sites" share the same origin (the elevated
// scanning-source position) at 5 different radii, outer → inner. Each
// site independently spawns a wireframe sphere shell that grows outward
// from that site's own radius, then disappears — on a repeating cycle.
// Spawning is staggered so site 0 (outermost) fires first, then each site
// inward in sequence, per explicit request. The whole 5-site cascade then
// repeats. Each sphere also spins about its own vertical axis while it's
// alive, per explicit request.
//
// Sites 1-4 grow-while-fading over a shared LIFE_S. Site 0 (outer) is a
// special case per explicit request: it keeps growing, without fading,
// until the innermost site (4) has spawned — only then does it hold its
// radius and start fading out. See OUTER_GROW_DURATION_S/
// OUTER_FADE_DURATION_S below.
const SITE_COUNT = 5;
// Fractions of `deathRadius`, outer → inner — evenly spaced concentric
// anchors. Spacing widened from 0.1 to 0.15 of deathRadius per site (a
// 50% increase) per explicit request for more distance between spheres —
// scaled up uniformly from the previous [0.5, 0.4, 0.3, 0.2, 0.1] rather
// than just pushing the outermost further out, so every gap grows evenly.
const SITE_FRACTIONS = [0.75, 0.6, 0.45, 0.3, 0.15];
// How far each site's sphere grows beyond its own site radius, as a
// fraction of deathRadius — kept proportional (90%) to the gap between
// adjacent sites (now 0.15 * deathRadius) so sites still read as distinct
// pulses, not one blur.
const GROWTH_FRACTION = 0.135;
const LIFE_S = 3.0; // grow+fade duration, shared by sites 1-4 (not the outer site — see below)
// Slowed twice per explicit request ("rotate slowly", then "even more") —
// decoupled from LIFE_S (which would complete a full showy spin every
// 3s); a pulse now only turns a sliver of a full rotation before it
// fades, reading as a near-imperceptible drift rather than a spin.
const ROTATION_PERIOD_S = 30.0;
const ROTATION_RAD_S = (Math.PI * 2) / ROTATION_PERIOD_S;
const STAGGER_S = 1.0; // time between successive site spawns, outer first
const PERIOD_S = SITE_COUNT * STAGGER_S; // the full cascade repeats on this period
// The outermost site (index 0) is a special case per explicit request: it
// keeps growing (no fade) until the innermost site (index 4) spawns, then
// holds its radius and fades out — rather than fading on its own fixed
// LIFE_S like every other site. OUTER_GROW_DURATION_S is exactly the time
// from the outer site's own spawn to the innermost site's spawn (4
// stagger-intervals later); OUTER_FADE_DURATION_S reuses LIFE_S as the
// fade-only duration once growth stops, since no specific fade length was
// given ("adjust the timing accordingly").
const OUTER_GROW_DURATION_S = (SITE_COUNT - 1) * STAGGER_S;
const OUTER_FADE_DURATION_S = LIFE_S;
const OPACITY_START = 0.35; // subtler than the alert ripples' 0.6 — this is ambient, not an event
// The lower hemisphere (toward the floor, from this fixed downward-
// looking camera) reads fainter than the upper one — approximates "faint
// where the sphere overlaps the floor plane for the observer" per
// explicit request, without a per-pixel/depth-based shader: since the
// camera is fixed and looks down at a Y=0 floor, the lower half of each
// sphere is what visually sits over the floor, so a static equator split
// is a reasonable, cheap stand-in for true screen-space overlap.
const LOWER_HEMISPHERE_OPACITY_FACTOR = 0.4;
const SEGMENTS_WIDTH = 32;
const SEGMENTS_HEIGHT = 16;
const START_SCALE = 0.001; // floor for scale, avoids a literal zero-scale matrix

const COLOR = new THREE.Color(CONTINUOUS_PULSE_HEX);

function splitByHemisphere(geometry: THREE.WireframeGeometry): {
  upper: THREE.BufferGeometry;
  lower: THREE.BufferGeometry;
} {
  const position = geometry.getAttribute("position") as THREE.BufferAttribute;
  const upperPositions: number[] = [];
  const lowerPositions: number[] = [];
  // Line segments come in consecutive vertex pairs; keep whole segments
  // together, bucketed by their midpoint's y, so no segment is split
  // mid-line.
  for (let i = 0; i < position.count; i += 2) {
    const y0 = position.getY(i);
    const y1 = position.getY(i + 1);
    const bucket = y0 + y1 >= 0 ? upperPositions : lowerPositions;
    for (const idx of [i, i + 1]) {
      bucket.push(position.getX(idx), position.getY(idx), position.getZ(idx));
    }
  }
  const upper = new THREE.BufferGeometry();
  upper.setAttribute("position", new THREE.Float32BufferAttribute(upperPositions, 3));
  const lower = new THREE.BufferGeometry();
  lower.setAttribute("position", new THREE.Float32BufferAttribute(lowerPositions, 3));
  return { upper, lower };
}

const unitSphereHemispheres = splitByHemisphere(
  new THREE.WireframeGeometry(new THREE.SphereGeometry(1, SEGMENTS_WIDTH, SEGMENTS_HEIGHT)),
);

interface Pulse {
  siteIndex: number;
  upperMesh: THREE.LineSegments;
  upperMaterial: THREE.LineBasicMaterial;
  lowerMesh: THREE.LineSegments;
  lowerMaterial: THREE.LineBasicMaterial;
  startRadius: number;
  endRadius: number;
  age: number;
}

export interface ContinuousRipples {
  group: THREE.Group;
  update(deltaSeconds: number): void;
}

export function createContinuousRipples(
  position: THREE.Vector3,
  deathRadius: number,
): ContinuousRipples {
  const group = new THREE.Group();
  group.position.copy(position);

  const pulses: Pulse[] = [];
  let elapsedS = 0;
  // Site i first spawns at i * STAGGER_S, then again every PERIOD_S after that.
  const nextSpawnAt = SITE_FRACTIONS.map((_, i) => i * STAGGER_S);

  function spawnAt(siteIndex: number): void {
    const startRadius = SITE_FRACTIONS[siteIndex] * deathRadius;
    const endRadius = startRadius + GROWTH_FRACTION * deathRadius;

    const upperMaterial = new THREE.LineBasicMaterial({
      color: COLOR,
      transparent: true,
      opacity: OPACITY_START,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const lowerMaterial = new THREE.LineBasicMaterial({
      color: COLOR,
      transparent: true,
      opacity: OPACITY_START * LOWER_HEMISPHERE_OPACITY_FACTOR,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    // Shared geometry across every pulse — grown via scale, not
    // regenerated per frame, so never disposed per-pulse.
    const upperMesh = new THREE.LineSegments(unitSphereHemispheres.upper, upperMaterial);
    const lowerMesh = new THREE.LineSegments(unitSphereHemispheres.lower, lowerMaterial);
    const startScale = Math.max(startRadius, START_SCALE);
    upperMesh.scale.setScalar(startScale);
    lowerMesh.scale.setScalar(startScale);
    group.add(upperMesh, lowerMesh);
    pulses.push({
      siteIndex,
      upperMesh,
      upperMaterial,
      lowerMesh,
      lowerMaterial,
      startRadius,
      endRadius,
      age: 0,
    });
  }

  function removePulse(index: number): void {
    const pulse = pulses[index];
    group.remove(pulse.upperMesh, pulse.lowerMesh);
    pulse.upperMaterial.dispose();
    pulse.lowerMaterial.dispose();
    pulses.splice(index, 1);
  }

  function update(deltaSeconds: number): void {
    elapsedS += deltaSeconds;

    for (let i = 0; i < SITE_COUNT; i++) {
      if (elapsedS >= nextSpawnAt[i]) {
        spawnAt(i);
        nextSpawnAt[i] += PERIOD_S;
      }
    }

    for (let i = pulses.length - 1; i >= 0; i--) {
      const pulse = pulses[i];
      pulse.age += deltaSeconds;

      let radius: number;
      let fadeFraction: number; // 1 = full opacity, 0 = fully faded

      if (pulse.siteIndex === 0) {
        // Outer site: grow only (no fade) until the innermost site has
        // spawned, then hold radius and fade out — per explicit request.
        if (pulse.age < OUTER_GROW_DURATION_S) {
          radius = THREE.MathUtils.lerp(
            pulse.startRadius,
            pulse.endRadius,
            pulse.age / OUTER_GROW_DURATION_S,
          );
          fadeFraction = 1;
        } else {
          const fadeAge = pulse.age - OUTER_GROW_DURATION_S;
          if (fadeAge >= OUTER_FADE_DURATION_S) {
            removePulse(i);
            continue;
          }
          radius = pulse.endRadius;
          fadeFraction = 1 - fadeAge / OUTER_FADE_DURATION_S;
        }
      } else {
        // Sites 1-4: unchanged — grow-while-fading over the shared LIFE_S.
        if (pulse.age >= LIFE_S) {
          removePulse(i);
          continue;
        }
        const t = pulse.age / LIFE_S;
        radius = THREE.MathUtils.lerp(pulse.startRadius, pulse.endRadius, t);
        fadeFraction = 1 - t;
      }

      const rotationStep = ROTATION_RAD_S * deltaSeconds;

      pulse.upperMesh.scale.setScalar(radius);
      pulse.upperMesh.rotation.y += rotationStep;
      pulse.upperMaterial.opacity = OPACITY_START * fadeFraction;

      pulse.lowerMesh.scale.setScalar(radius);
      pulse.lowerMesh.rotation.y += rotationStep;
      pulse.lowerMaterial.opacity = OPACITY_START * LOWER_HEMISPHERE_OPACITY_FACTOR * fadeFraction;
    }
  }

  return { group, update };
}
