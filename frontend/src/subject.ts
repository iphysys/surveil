import * as THREE from "three";
import type { DetectionEvent } from "./types";
import { ALERT_ACCENT_HEX, RESOLVED_ACCENT_HEX } from "./palette";

// Per DEMO_SPEC.md §5b: a capsule "subject" positioned toward the floor's
// far/back corner, emissive material, color driven by status. During
// detected/escalated it must be the brightest element on screen. Surrounded
// by a soft additive particle shell, a wider additive sprite halo, and a
// small twinkling particle cluster. See "Subject lifecycle" in §5b for the
// spawn/hold/fade timing implemented below (replaces the old persistent
// grow/shrink breathing). Only ONE subject exists on screen, ever — Sprint
// 8's cosmetic "echo blip" system was deleted in Sprint 9, not modified.
export const SUBJECT_RADIUS = 0.25;
const SUBJECT_CYLINDER_LENGTH = 0.9;
export const SUBJECT_HEIGHT = SUBJECT_CYLINDER_LENGTH + SUBJECT_RADIUS * 2;

const SHELL_PARTICLE_COUNT = 1000;
const SHELL_RADIUS_XZ = 0.45;
const SHELL_HALF_HEIGHT = 0.75;

const HALO_DIAMETER = SUBJECT_RADIUS * 2 * 3; // "~3x capsule width"

const TWINKLE_COUNT = 80;
const TWINKLE_RADIUS_XZ = 0.6;
const TWINKLE_HALF_HEIGHT = 0.9;
const TWINKLE_DRIFT_AMPLITUDE = 0.08; // subtle — not meant to read as "animating" at a glance

// Lifecycle timings per DEMO_SPEC.md §5b's "Subject lifecycle" — starting
// points, tuned visually.
const GROW_DURATION_S = 0.8;
const FADE_DURATION_S = 1.0;
const PULSE_BASE_HZ = 0.15;
const PULSE_MAX_HZ = 1.2;
const HALO_PULSE_AMPLITUDE = 0.35;

const ALERT_COLOR = new THREE.Color(ALERT_ACCENT_HEX);
const RESOLVED_COLOR = new THREE.Color(RESOLVED_ACCENT_HEX);
const COLOR_LERP_SPEED = 6; // fast — resolved's color shift is meant to read as "brief"
// Raised in Sprint 7 so the capsule unmistakably out-blooms other bright,
// low-threshold scene elements (floor tint, the continuous scanning
// pulse) during alert states.
const EMISSIVE_INTENSITY_SCALE = 4.5;

function easeOutCubic(t: number): number {
  const clamped = THREE.MathUtils.clamp(t, 0, 1);
  return 1 - Math.pow(1 - clamped, 3);
}

function createGlowTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const gradient = ctx.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2,
  );
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.4, "rgba(255,255,255,0.4)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);
  return new THREE.CanvasTexture(canvas);
}

type Phase = "hidden" | "growing" | "held" | "fading";

export interface Subject {
  group: THREE.Group;
  position: THREE.Vector3;
  height: number;
  update(deltaSeconds: number, event: DetectionEvent | null): void;
  getColor(): THREE.Color;
  getIntensity(): number;
}

export function createSubject(position: THREE.Vector3): Subject {
  const group = new THREE.Group();
  group.position.copy(position);
  const glowTexture = createGlowTexture();

  const capsuleGeometry = new THREE.CapsuleGeometry(
    SUBJECT_RADIUS,
    SUBJECT_CYLINDER_LENGTH,
    8,
    16,
  );
  const capsuleMaterial = new THREE.MeshStandardMaterial({
    color: 0x050608,
    emissive: ALERT_COLOR,
    emissiveIntensity: 0,
    transparent: true,
    opacity: 0,
    roughness: 0.6,
    metalness: 0.1,
  });
  const capsule = new THREE.Mesh(capsuleGeometry, capsuleMaterial);
  capsule.position.y = SUBJECT_HEIGHT / 2;
  capsule.scale.setScalar(0);
  group.add(capsule);

  // Tight additive particle shell hugging the capsule.
  const shellPositions = new Float32Array(SHELL_PARTICLE_COUNT * 3);
  for (let i = 0; i < SHELL_PARTICLE_COUNT; i++) {
    const r = Math.cbrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    shellPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta) * SHELL_RADIUS_XZ;
    shellPositions[i * 3 + 1] =
      SUBJECT_HEIGHT / 2 + r * Math.cos(phi) * SHELL_HALF_HEIGHT;
    shellPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) * SHELL_RADIUS_XZ;
  }
  const shellGeometry = new THREE.BufferGeometry();
  shellGeometry.setAttribute("position", new THREE.BufferAttribute(shellPositions, 3));
  const shellMaterial = new THREE.PointsMaterial({
    size: 0.06,
    map: glowTexture,
    color: ALERT_COLOR,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const shell = new THREE.Points(shellGeometry, shellMaterial);
  shell.scale.setScalar(0);
  group.add(shell);

  // Soft wide halo sprite, ~3x capsule width, billboards to camera automatically.
  const haloMaterial = new THREE.SpriteMaterial({
    map: glowTexture,
    color: ALERT_COLOR,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });
  const halo = new THREE.Sprite(haloMaterial);
  halo.scale.set(HALO_DIAMETER, HALO_DIAMETER, 1);
  halo.position.y = SUBJECT_HEIGHT / 2;
  group.add(halo);

  // Small twinkling particle cluster: slow per-particle drift + independent
  // opacity flicker (achieved via additive color-brightness modulation,
  // since PointsMaterial has no per-vertex alpha).
  const twinkleBase = new Float32Array(TWINKLE_COUNT * 3);
  const twinklePositions = new Float32Array(TWINKLE_COUNT * 3);
  const twinkleColors = new Float32Array(TWINKLE_COUNT * 3);
  const driftPhase = new Float32Array(TWINKLE_COUNT);
  const driftFreq = new Float32Array(TWINKLE_COUNT);
  const flickerPhase = new Float32Array(TWINKLE_COUNT);
  const flickerFreq = new Float32Array(TWINKLE_COUNT);

  for (let i = 0; i < TWINKLE_COUNT; i++) {
    const r = Math.cbrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    twinkleBase[i * 3] = r * Math.sin(phi) * Math.cos(theta) * TWINKLE_RADIUS_XZ;
    twinkleBase[i * 3 + 1] =
      SUBJECT_HEIGHT / 2 + r * Math.cos(phi) * TWINKLE_HALF_HEIGHT;
    twinkleBase[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta) * TWINKLE_RADIUS_XZ;
    driftPhase[i] = Math.random() * Math.PI * 2;
    driftFreq[i] = 0.15 + Math.random() * 0.25;
    flickerPhase[i] = Math.random() * Math.PI * 2;
    flickerFreq[i] = 0.3 + Math.random() * 0.9;
  }
  twinklePositions.set(twinkleBase);

  const twinkleGeometry = new THREE.BufferGeometry();
  twinkleGeometry.setAttribute(
    "position",
    new THREE.BufferAttribute(twinklePositions, 3),
  );
  const twinkleColorAttr = new THREE.BufferAttribute(twinkleColors, 3);
  twinkleGeometry.setAttribute("color", twinkleColorAttr);
  const twinklePositionAttr = twinkleGeometry.getAttribute(
    "position",
  ) as THREE.BufferAttribute;

  const twinkleMaterial = new THREE.PointsMaterial({
    size: 0.05,
    map: glowTexture,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });
  const twinkle = new THREE.Points(twinkleGeometry, twinkleMaterial);
  group.add(twinkle);

  // --- Lifecycle state -----------------------------------------------
  const currentColor = new THREE.Color(ALERT_COLOR);
  let phase: Phase = "hidden";
  let phaseElapsed = 0; // resets on every phase transition — envelope timing only
  let elapsedS = 0; // never resets — twinkle drift/flicker timing only
  let lastStatus: DetectionEvent["status"] | null = null;
  let pulsePhase = 0;
  let growScale = 0; // 0..1 — drives capsule/shell scale
  let envelopeOpacity = 0; // 0..1 — drives capsule/shell/halo/twinkle opacity

  function update(deltaSeconds: number, event: DetectionEvent | null): void {
    const status = event?.status ?? "idle";
    const confidence = event?.confidence ?? 0;

    if (status !== lastStatus) {
      lastStatus = status;
      if (status === "idle") {
        phase = "hidden";
        phaseElapsed = 0;
        growScale = 0;
        envelopeOpacity = 0;
      } else if (status === "detected" || status === "escalated") {
        if (phase === "hidden" || phase === "fading") {
          phase = "growing";
          phaseElapsed = 0;
        }
        // else: already growing or held — continue uninterrupted, no reset
      } else if (status === "resolved") {
        phase = "fading";
        phaseElapsed = 0;
      }
    }

    phaseElapsed += deltaSeconds;
    elapsedS += deltaSeconds;

    // Color target: red for detected/escalated, green (briefly) for resolved.
    const colorTarget = status === "resolved" ? RESOLVED_COLOR : ALERT_COLOR;
    const colorT = 1 - Math.exp(-COLOR_LERP_SPEED * deltaSeconds);
    currentColor.lerp(colorTarget, colorT);

    if (phase === "growing") {
      const t = easeOutCubic(phaseElapsed / GROW_DURATION_S);
      growScale = t;
      envelopeOpacity = t;
      if (phaseElapsed >= GROW_DURATION_S) {
        phase = "held";
        phaseElapsed = 0;
      }
    } else if (phase === "held") {
      growScale = 1;
      envelopeOpacity = 1;
    } else if (phase === "fading") {
      const t = THREE.MathUtils.clamp(phaseElapsed / FADE_DURATION_S, 0, 1);
      growScale = 1; // no shrink — fade in place
      envelopeOpacity = 1 - t;
    } else {
      growScale = 0;
      envelopeOpacity = 0;
    }

    // Halo pulse — escalated-hold only; rate scales with confidence. The
    // capsule itself stays visually steady (no scale/intensity pulse).
    let haloPulse = 1;
    if (phase === "held" && status === "escalated") {
      const freqHz = PULSE_BASE_HZ + confidence * (PULSE_MAX_HZ - PULSE_BASE_HZ);
      pulsePhase += deltaSeconds * freqHz * Math.PI * 2;
      haloPulse = 1 + Math.sin(pulsePhase) * HALO_PULSE_AMPLITUDE;
    }

    capsuleMaterial.emissive.copy(currentColor);
    capsuleMaterial.emissiveIntensity = envelopeOpacity * EMISSIVE_INTENSITY_SCALE;
    capsuleMaterial.opacity = envelopeOpacity;
    capsule.scale.setScalar(growScale);

    shellMaterial.color.copy(currentColor);
    shellMaterial.opacity = envelopeOpacity * 0.9;
    shell.scale.setScalar(growScale);

    haloMaterial.color.copy(currentColor);
    haloMaterial.opacity = THREE.MathUtils.clamp(envelopeOpacity * 0.5 * haloPulse, 0, 1);

    for (let i = 0; i < TWINKLE_COUNT; i++) {
      const dx = TWINKLE_DRIFT_AMPLITUDE * Math.sin(elapsedS * driftFreq[i] + driftPhase[i]);
      const dy =
        TWINKLE_DRIFT_AMPLITUDE *
        Math.sin(elapsedS * driftFreq[i] * 0.7 + driftPhase[i] + 1.3);
      const dz =
        TWINKLE_DRIFT_AMPLITUDE *
        Math.sin(elapsedS * driftFreq[i] * 0.9 + driftPhase[i] + 2.6);
      twinklePositionAttr.setXYZ(
        i,
        twinkleBase[i * 3] + dx,
        twinkleBase[i * 3 + 1] + dy,
        twinkleBase[i * 3 + 2] + dz,
      );

      const flicker =
        0.3 +
        0.7 *
          (0.5 +
            0.5 * Math.sin(elapsedS * flickerFreq[i] * Math.PI * 2 + flickerPhase[i]));
      const brightness = envelopeOpacity * flicker;
      twinkleColorAttr.setXYZ(
        i,
        currentColor.r * brightness,
        currentColor.g * brightness,
        currentColor.b * brightness,
      );
    }
    twinklePositionAttr.needsUpdate = true;
    twinkleColorAttr.needsUpdate = true;
  }

  return {
    group,
    position,
    height: SUBJECT_HEIGHT,
    update,
    getColor: () => currentColor,
    getIntensity: () => envelopeOpacity,
  };
}
