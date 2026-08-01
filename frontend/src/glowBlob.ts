import * as THREE from "three";
import type { DetectionEvent } from "./types";
import { ALERT_ACCENT_HEX, IDLE_ACCENT_HEX, RESOLVED_ACCENT_HEX } from "./palette";

// Radial-gradient sprite texture, generated on a canvas so the particles
// render as soft glowing dots rather than hard squares.
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

// Target color + base opacity per status, per DEMO_SPEC.md §5.
// Opacity values aren't spec'd numerically ("intensity" is only described
// qualitatively) — chosen so detected/escalated read as more urgent.
const STATUS_TARGETS: Record<
  DetectionEvent["status"],
  { color: THREE.Color; opacity: number }
> = {
  idle: { color: new THREE.Color(IDLE_ACCENT_HEX), opacity: 0.6 },
  detected: { color: new THREE.Color(ALERT_ACCENT_HEX), opacity: 0.9 },
  escalated: { color: new THREE.Color(ALERT_ACCENT_HEX), opacity: 0.95 },
  resolved: { color: new THREE.Color(RESOLVED_ACCENT_HEX), opacity: 0.75 },
};

const COLOR_LERP_SPEED = 4; // exponential approach factor, per second — gives the "fades back to idle gray" transition
const PULSE_BASE_HZ = 0.15; // idle "breathing" rate at confidence 0
const PULSE_MAX_HZ = 1.2; // rate at confidence 1
const PULSE_SCALE_AMPLITUDE = 0.12;
const PULSE_OPACITY_AMPLITUDE = 0.15;

export interface GlowBlob {
  points: THREE.Points;
  update(deltaSeconds: number, event: DetectionEvent | null): void;
}

export function createGlowBlob(): GlowBlob {
  const particleCount = 1200;
  const positions = new Float32Array(particleCount * 3);
  const radius = 0.9;

  for (let i = 0; i < particleCount; i++) {
    const r = radius * Math.cbrt(Math.random());
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(2 * Math.random() - 1);
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
    positions[i * 3 + 2] = r * Math.cos(phi);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const material = new THREE.PointsMaterial({
    size: 0.08,
    map: createGlowTexture(),
    color: IDLE_ACCENT_HEX,
    transparent: true,
    opacity: STATUS_TARGETS.idle.opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);

  const currentColor = new THREE.Color(IDLE_ACCENT_HEX);
  let currentBaseOpacity = STATUS_TARGETS.idle.opacity;
  let pulsePhase = 0;

  function update(deltaSeconds: number, event: DetectionEvent | null): void {
    const status = event?.status ?? "idle";
    const confidence = event?.confidence ?? 0;
    const target = STATUS_TARGETS[status];

    const t = 1 - Math.exp(-COLOR_LERP_SPEED * deltaSeconds);
    currentColor.lerp(target.color, t);
    currentBaseOpacity += (target.opacity - currentBaseOpacity) * t;

    const freqHz = PULSE_BASE_HZ + confidence * (PULSE_MAX_HZ - PULSE_BASE_HZ);
    pulsePhase += deltaSeconds * freqHz * Math.PI * 2;
    const wave = Math.sin(pulsePhase);

    material.color.copy(currentColor);
    material.opacity = THREE.MathUtils.clamp(
      currentBaseOpacity + wave * PULSE_OPACITY_AMPLITUDE,
      0,
      1,
    );
    points.scale.setScalar(1 + wave * PULSE_SCALE_AMPLITUDE);
  }

  return { points, update };
}
