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
// Every pulse grows continuously, at the same constant rate, for its
// entire life — right up until the instant it's fully faded away and
// removed, never freezing at a fixed size first — per explicit request.
// Sites 1-4 fade from the moment they spawn (their whole life is the
// fade). Site 0 (outer) is a special case per explicit request: it stays
// at full opacity — still growing throughout — for a hold phase, then
// fades out, continuing to grow as it does.
//
// The hold/fade split for site 0 was retimed (from an original
// hold-until-innermost-spawns, ~7s total life) per explicit request: the
// outer sphere must be FULLY faded away — not just starting to fade — by
// the time the SECOND-innermost site (index 3) spawns. Re-timed the whole
// cascade around that constraint rather than patching site 0 in
// isolation: site 0's total life is now exactly 3 * STAGGER_S (matching
// when site 3 spawns), split into a 2*STAGGER_S hold (ending when site 2,
// the middle site, spawns) and a 1*STAGGER_S fade (ending exactly when
// site 3 spawns) — both milestones tied to real spawn events, not
// arbitrary fractions. That total (3s at the current STAGGER_S) happens
// to already equal sites 1-4's own LIFE_S, so every one of the 5 pulses
// now shares the same 3s total lifespan — a deliberate, coherent
// re-timing, not a coincidence left unexamined.
const SITE_COUNT = 5;
// Fractions of `deathRadius`, outer → inner — evenly spaced concentric
// anchors. Spacing widened from 0.1 to 0.15 of deathRadius per site (a
// 50% increase) per explicit request for more distance between spheres —
// scaled up uniformly from the previous [0.5, 0.4, 0.3, 0.2, 0.1] rather
// than just pushing the outermost further out, so every gap grows evenly.
const SITE_FRACTIONS = [0.75, 0.6, 0.45, 0.3, 0.15];
// Growth speed, as a fraction of deathRadius grown per second — shared by
// every site/pulse, applied continuously for as long as the pulse lives.
// Raised from the previous fixed-amount model's implied rate (0.135
// deathRadius-fractions over 3s ≈ 0.045/s) to 0.055/s (~22% faster) per
// explicit request ("increase the rate of growth... a bit"). Because
// growth no longer stops at a fixed target, sites 1-4 now grow slightly
// past their old endpoint before fading away (a bit more overlap between
// adjacent sites than before) — an accepted side effect of switching to
// "grow the whole time," not separately re-tuned.
const GROWTH_RATE_FRACTION_PER_S = 0.055;
const LIFE_S = 3.0; // total life (spawn to fully faded) for sites 1-4
// Slowed three times now per explicit request ("rotate slowly", "even
// more", then "reduce... again") — decoupled from LIFE_S; a pulse only
// turns a sliver of a full rotation before it fades, reading as a
// near-imperceptible drift rather than a spin.
const ROTATION_PERIOD_S = 45.0;
const ROTATION_RAD_S = (Math.PI * 2) / ROTATION_PERIOD_S;
const STAGGER_S = 1.0; // time between successive site spawns, outer first
const PERIOD_S = SITE_COUNT * STAGGER_S; // the full cascade repeats on this period
// The outermost site (index 0) is a special case per explicit request: it
// stays at full opacity (still growing) until site 2 (the middle site)
// spawns, then fades out over exactly one more stagger-interval — finishing
// precisely when site 3 (the second-innermost) spawns, per explicit
// request. Rather than fading from the moment it spawns like sites 1-4.
const OUTER_HOLD_DURATION_S = (SITE_COUNT - 3) * STAGGER_S; // until site 2 spawns
const OUTER_FADE_DURATION_S = STAGGER_S; // finishes exactly when site 3 spawns
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

  const growthRate = GROWTH_RATE_FRACTION_PER_S * deathRadius; // units/s

  const pulses: Pulse[] = [];
  let elapsedS = 0;
  // Site i first spawns at i * STAGGER_S, then again every PERIOD_S after that.
  const nextSpawnAt = SITE_FRACTIONS.map((_, i) => i * STAGGER_S);

  function spawnAt(siteIndex: number): void {
    const startRadius = SITE_FRACTIONS[siteIndex] * deathRadius;

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
    pulses.push({ siteIndex, upperMesh, upperMaterial, lowerMesh, lowerMaterial, startRadius, age: 0 });
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

      let fadeFraction: number; // 1 = full opacity, 0 = fully faded

      if (pulse.siteIndex === 0) {
        // Outer site: full opacity (still growing) until site 2 spawns,
        // then fades — fully gone by the time site 3 spawns, continuing
        // to grow throughout.
        if (pulse.age < OUTER_HOLD_DURATION_S) {
          fadeFraction = 1;
        } else {
          const fadeAge = pulse.age - OUTER_HOLD_DURATION_S;
          if (fadeAge >= OUTER_FADE_DURATION_S) {
            removePulse(i);
            continue;
          }
          fadeFraction = 1 - fadeAge / OUTER_FADE_DURATION_S;
        }
      } else {
        // Sites 1-4: fading (and growing) from the moment they spawn.
        if (pulse.age >= LIFE_S) {
          removePulse(i);
          continue;
        }
        fadeFraction = 1 - pulse.age / LIFE_S;
      }

      const radius = pulse.startRadius + growthRate * pulse.age;
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
