# DEMO_SPEC.md — Smart Surveillance Demo

## 1. Purpose & audience

Optimized for a 3-second "whoa, cool tech" reaction from a general,
non-technical audience (social clips, pitch-deck opener, informal sharing).
This is explicitly NOT a due-diligence artifact for iDEX/TDF/DRDO
evaluators — keep it out of iphysys.com and unlinked from the real
prototypes.

This demo shows a hypothetical, fully synthetic "intruder detected in a
no-trespassing zone" scenario. It does not represent a working sensor,
camera, radar, or WiFi system. All data is scripted.

## 2. DetectionEvent shape (backend contract)

```typescript
interface DetectionEvent {
  id: string;
  timestamp: string; // ISO 8601
  sensor_modality: "camera" | "radar_sim" | "wifi_csi_sim";
  track_id: string;
  bearing: number;      // degrees, 0-359
  distance_m: number;
  zone: string;          // e.g. "Zone 3"
  confidence: number;    // 0-1
  status: "idle" | "detected" | "escalated" | "resolved";
}
```

Backend endpoint: `GET /api/events` returns the current `DetectionEvent`.
The server advances through the scripted sequence below on an internal
timer; each poll returns whatever event is "current" at that moment. (If
using SSE/WebSocket instead of polling, push the same object on each state
transition.)

## 3. Scripted sequence (exact timings)

| Time (s) | status               | track_id | bearing         | distance_m | confidence         | zone   |
|----------|----------------------|----------|-----------------|------------|---------------------|--------|
| 0–3      | idle                 | —        | —               | —          | —                   | —      |
| 3        | detected             | trk-001  | 214             | 42         | 0.61                | Zone 3 |
| 3–5      | detected (ramping)   | trk-001  | 214             | 38         | 0.61 → 0.97 (linear)| Zone 3 |
| 5        | escalated            | trk-001  | 214             | 35         | 0.97                | Zone 3 |
| 5–9      | escalated (hold)     | trk-001  | 213–216 (jitter)| 30–35      | 0.95–0.98           | Zone 3 |
| 9        | resolved             | trk-001  | —               | —          | —                   | Zone 3 |
| 9–12     | resolved (hold)      | —        | —               | —          | —                   | —      |
| 12       | loop to idle         | —        | —               | —          | —                   | —      |

Loop indefinitely. The backend owns this timer; the frontend never runs its
own independent clock for state — it always reflects what the backend
reports, even on late poll or reconnect.

## 4. HUD layout

- Top banner: alert state label + timestamp (visible only when
  `status !== "idle"`)
- Right panel fields, in order: `sensor_modality`, `track_id`, `bearing`,
  `distance_m`, `confidence`, `zone`, `status`
- Do NOT include any vitals-style fields (heart rate, breathing, a
  "presence" pill) — this is a detection/tracking HUD, not a biosignature
  panel
- Bottom-right corner: persistent, non-dismissible text "Simulated
  scenario — synthetic detection feed", visible in all states

## 5. Visual palette

- Background: near-black (dark surface, e.g. `#0a0d12`)
- Idle state accent: muted gray/blue
- Detected/escalated accent: red (`#E24B4A` family)
- Resolved state accent: muted green, brief only, fades back to idle gray
- No neon/glow filters — flat colors, opacity, and scale animation only
- Wireframe spheres: thin, low-opacity strokes, slow rotation, not tied to
  detection state
- Glow blob: particle sprite with additive blending; color shifts
  idle → detected → escalated per palette above; pulse rate increases as
  confidence rises

## 5a. Radar sweep & pulse rings (state-driven overlays)

The blob's own state-driven behavior is limited to the color shift and
confidence-scaled pulse rate in §5 above — it has no separate "sweep"
behavior. Sweep and rings are two additional, independent overlay elements:

### Radar sweep

- A flat wedge (~35° arc) rotating clockwise around the scene center, full
  360° rotation every 3s, constant speed, running in ALL states including
  idle
- Fill: detected/escalated accent color at 0.12 opacity during
  detected/escalated; muted gray-blue idle accent at 0.08 opacity during
  idle/resolved
- No trail, no fade gradient — a single flat translucent wedge

### Pulse rings

- Emitted from the detection blob's position, only while status is
  "detected" or "escalated" — none in idle/resolved
- Three staggered rings on a shared 1.8s loop, offset 0.6s apart: each
  scales from 0.4x to 2.2x while fading opacity 0.7 → 0
- Ring color: the red accent (`#E24B4A` family), thin flat stroke, no
  glow/blur

## 6. Explicit non-goals

- No real camera, radar, or WiFi integration at any layer
- No database, no auth, no external API calls in the backend
- No claims, in UI copy or code comments, that this represents live or real
  sensing
- Not linked from iphysys.com or any evaluator-facing materials
