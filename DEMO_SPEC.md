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

## 4a. HUD restyle

- Monospace font stack (`ui-monospace` / `'JetBrains Mono'` fallback)
- Labels: uppercase, letter-spacing 0.08em, dim gray; values: right-aligned,
  accent-colored where state-relevant
- Panels: dark translucent background, 1px subtle border, rounded corners,
  small uppercase panel header ("DETECTION FEED")
- Top-left brand block: "iPhySys" wordmark + subtitle "PERIMETER SENSING
  DEMO — SYNTHETIC DATA"
- Top-right: a pill badge showing "SIMULATED" (always, all states) styled
  like a status badge
- Left panel "EVENT LOG": monospace, newest-first list of state transitions
  with timestamps (e.g. "01:41:16 ESCALATED trk-001 zone 3"), max 6 rows
  visible, older rows fade. Derived client-side from observed
  `DetectionEvent.status` changes — no backend changes.
- Bottom-center scenario pill: small bordered badge reading "SCENARIO:
  PERIMETER BREACH — SYNTHETIC", visible in all states.
- HUD value micro-flicker: while a track is active, bearing/distance/
  confidence values update with the existing jitter on every poll; ensure
  displayed values visibly tick rather than appearing frozen between
  phases.
- Keep the bottom-right disclosure line as-is

## 5. Visual palette

- Background: near-black (dark surface, e.g. `#0a0d12`)
- Two-tone scheme: STRUCTURE elements (floor grid, sweep wedge in
  idle) use a cool desaturated blue-gray, `#7A8FA6` family — brighter than
  the previous single idle accent. THREAT/ALERT elements (subject capsule,
  pulse rings, sweep in detected/escalated, HUD accent values) keep the red
  `#E24B4A` family. The subject must never share a hue with the structure.
- Resolved state accent: muted green, brief only, fades back to idle gray
- Additive-blended glow and bloom post-processing are required. Use
  `THREE.AdditiveBlending` for particles/sprites and `UnrealBloomPass`
  (strength ~1.4, radius ~0.6, threshold ~0.1, tune visually until
  wireframes visibly glow) on the composer.
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

### Pulse rings — SUPERSEDED as of Sprint 9

The 3-ring, 0.4x-2.2x-scale pulse loop originally described here is
deleted. Replaced by the Ripple system in §5b (water-wave rings expanding
from the subject's base to a floor-relative death radius). Kept here only
as a historical marker — not current behavior.

## 5b. Scene composition

- Camera: fixed perspective at ~35° elevation, distance/look-at tuned so
  the full scene composition (floor, subject, and the elevated
  scanning-source elements around it) fits comfortably in frame, looking
  at scene center. Fully stationary — no auto-orbit, no user controls. The
  floor plane must never appear to rotate; the only visible motion in the
  scene is the sweep wedge, ripples, the continuous scanning pulse,
  particle drift/twinkle, and HUD value ticks. Reframed as needed
  (distance/look-at) so the full floor and scene composition still fit
  comfortably after the floor orientation and subject position changes
  below — the camera itself still never moves at runtime, only its fixed
  setup values may differ from earlier sprints. (The domes that
  originally drove this framing's numeric target are deleted — see the
  note where their bullet used to be, below.) Distance was first solved
  so all 4 floor corners fit on-screen with a comfortable margin, then
  brought back in per explicit request for a tighter frame: a small
  portion of the FRONT corner (the one nearest the camera) being outside
  the frame is explicitly acceptable, and every other corner still stays
  comfortably on-screen (empirically solved — see `cameraRig.ts`'s doc
  comment for both passes).
- Floor orientation: the scene group's yaw (floor and everything on it —
  subject, sweep, ripples, floor particles) is tuned — not pinned to
  a specific degree value — so the floor rectangle's on-screen projection
  satisfies the BACK corner sitting offset somewhat LEFT of frame center,
  and the FRONT corner somewhat RIGHT. (The earlier requirement that the
  LEFT and RIGHT corners share a horizontal screen line is REMOVED as of
  this amendment, per explicit request — it doesn't need to hold, and
  isn't expected to now that the floor is a rectangle rather than a
  square; see Ground plane, below.)
  Implemented as a one-time rotation of the whole composition's parent
  group (or an equivalent fixed camera-azimuth choice) — not a per-frame
  rotation; the camera-fixed / floor-never-rotates rule still stands (only
  elevation and distance are fixed camera setup values; the yaw lives on
  the group, not the camera). The subject remains at its Sprint 8 position
  toward the back corner region; the ripple origin, the sweep's pivot, and
  the floor tint falloff all re-center on it after any yaw change.
  Acceptance: screenshot the idle scene, measure the four corners' screen
  positions, confirm the back/front offset condition above.
- Ground plane: **pure black** floor plane at y=0 (per explicit request —
  was a very-dark blue-gray) with a grid of dots (instanced points); a
  radial accent-color tint falls off from the subject's position — red
  tint within ~2x subject radius, fading to the structure color beyond
  that. Tint intensity scales with confidence. The floor is a rectangle,
  not a square: the edge running from the BACK corner to the RIGHT corner
  (and its parallel, the FRONT-to-LEFT edge) is 18 units long — lengthened
  per explicit request, no exact target given. The edge running from the
  BACK corner to the LEFT corner (and its parallel, the FRONT-to-RIGHT
  edge) was originally 12 units, then lengthened by an explicit 20% to
  14.4 units. Dot spacing is uniform in both directions (not a stretched
  index grid) — derived from a 32-dot baseline density along the shorter
  (Z) edge (halved from an original 64, per explicit request for a less
  dense grid), then applied along the longer (X) edge too, so dot count
  scales with the rectangle's proportions rather than distorting spacing.
- Subject: a capsule (`THREE.CapsuleGeometry` or cylinder+spheres)
  positioned toward the FAR/BACK corner of the floor (~70-80% of the way
  toward the back corner along the diagonal, not floor center), emissive
  material, color driven by status (idle: hidden, detected/escalated:
  threat/red accent, resolved: brief muted green then hide). During
  detected/escalated it must be the brightest element on screen — emissive
  intensity raised so it blooms hard. Surround it with a soft additive
  particle shell, a soft additive sprite halo (~3x capsule width), and a
  small twinkling particle cluster (~80 particles, slow drift, random
  per-particle opacity flicker). The ripple origin, the sweep's pivot, and
  the floor tint falloff all re-center on this new position. See
  Subject lifecycle, below, for spawn/hold/fade timing (replaces any
  persistent grow/shrink "breathing" on the subject itself). Only ONE
  subject exists on screen, ever — no echo blips or other secondary/
  duplicate subject-like elements (echo blips deleted as of Sprint 9).

### Subject lifecycle

- idle: no subject visible (capsule, shell, halo, and twinkle all fully
  hidden). Only ONE subject exists on screen, ever.
- detected: subject spawns at scale 0 and grows to full over ~0.8s
  (ease-out), halo fading in with it
- escalated: subject holds at full scale with a halo-only pulse (pulse
  rate still scales with confidence, per §5's existing rule) — the capsule
  itself stays visually steady; only the halo oscillates. (Sprint 8's echo
  blips are DELETED as of Sprint 9 — removed entirely, not replaced. See
  the Ripple system, below, for this phase's state-driven overlay instead.)
- resolved: the subject fades out over ~1s (no shrink — fade in place)
- loop back to idle: nothing visible
- Domes: DELETED per explicit request — the 3 concentric wireframe
  breathing spheres (in all their forms across Sprints 5-9: full spheres →
  hemispheres → elevated full spheres) are removed entirely, not replaced.
  The elevated scanning-source height concept they established lives on —
  the radar sweep and the continuous scanning pulse (below) both still sit
  at that height (one subject-height above the subject's base) — but there
  is no longer a visible dome mesh there.
- Radar sweep: keep the §5a wedge geometry/timing, lying FLAT (horizontal),
  rotating about the scanning source's vertical axis — not billboarded to
  camera. Sits at the elevated scanning-source height (one subject-height
  above the subject's base), not ground level, since it represents the
  elevated scanning source's own rotating beam.
- Vignette: a subtle radial vignette darkening the frame corners by ~25%,
  via post-processing or a fullscreen overlay.
- Micro-motion (all states): floor-adjacent particle drift (the twinkling
  cluster above) and HUD value flicker (§4a) keep the frame from ever
  reading as perfectly static — but keep all of it subtle; no element
  other than the radar sweep, ripples, the continuous scanning pulse
  (below), and the subject's own spawn-grow/fade-out (all
  per Subject lifecycle and Ripple system, above/below) should visibly
  "animate" at a glance.

### Ripple system (water-wave rings)

Supersedes §5a's old pulse rings (3-ring, 0.4x-2.2x-scale loop) — that
system is deleted, not modified. Replaces it entirely:

- Flat circular rings lying ON the floor plane, originating at the
  subject's base position, like ripples from a point disturbance in water
- Each ripple expands radially outward at constant speed; opacity starts
  ~0.6 and fades linearly to 0, reaching 0 exactly when the ripple's radius
  equals the distance from the subject's base to the floor's LEFT corner
  (the corner identified in Floor orientation, above). The ripple is
  removed at that radius — it must never cross the left corner.
- Emission: one new ripple every ~1.4s while status is "detected" or
  "escalated"; no ripples in idle; on resolved, no new ripples and any live
  ones finish their expansion naturally while the subject fades
- Style: thin flat stroke, red accent family (`#E24B4A`), additive
  blending, ring width stays constant as it expands
- Speed: chosen so a ripple's full life (spawn to death-at-left-corner-
  radius) is ~2.5-3s — tune visually
- Cosmetic, driven solely by `DetectionEvent.status` — same isolation rule
  as the rest of this section: no HUD, event log, or data-path involvement

### Continuous scanning pulse

An always-on ripple distinct from the Ripple system above — represents the
elevated scanning source's own continuous activity rather than a
detection event, so it runs in every state including idle, irrespective of
`DetectionEvent.status`.

- 5 concentric fixed "sites" share the same origin — a point a bit below
  the elevated scanning-source height the radar sweep uses (one subject-
  height above the subject's base, minus 30% of the subject's height,
  lowered per explicit request; its own origin, not shared with the
  sweep) — at 5 different radii, evenly spaced 15% of deathRadius apart,
  from 15% to 75% of the same death radius the floor Ripple system above
  uses (the subject-to-floor-left-corner distance), outer → inner.
  Widened from an initial 10% spacing (10%-50% spread) per explicit
  request for more distance between spheres, scaled up uniformly rather
  than just pushing the outermost site further out.
- Each pulse is a full 3D wireframe sphere shell (`SphereGeometry`), not a
  flat ring — grows via uniform scale from a shared unit-sphere geometry.
  Each sphere is split at its equator into an upper and lower hemisphere,
  rendered as two separate meshes sharing the same color/scale/rotation:
  the lower hemisphere (toward the floor, from this fixed downward-
  looking camera) renders at 40% of the upper hemisphere's opacity — per
  explicit request that the spheres read fainter specifically where they
  visually overlap the floor plane for the observer. This is a static,
  cheap approximation (not a true per-pixel/depth-based occlusion test):
  since the camera is fixed and looks down at a Y=0 floor, the lower half
  of each sphere is what visually sits over the floor, so a fixed equator
  split stands in for genuine screen-space overlap detection.
- Each site independently spawns its own pulse, which starts at that
  site's own radius and grows continuously at a constant rate (~5.5% of
  the death radius per second — raised ~22% from an initial ~4.5%/s per
  explicit request for "a bit" faster growth) for as long as the pulse
  lives, right up until the instant it's fully faded away — growth never
  stops early and holds at a fixed size, per explicit request
- Spawn timing: sequential, outermost site first, then each site inward
  in turn, staggered ~1s apart. Once all 5 have spawned, the whole 5-site
  cascade repeats.
- Sites 1-4 (all but the outermost) fade from the moment they spawn, over
  a shared ~3s life (still growing throughout, per above). The OUTERMOST
  site is a special case per explicit request: it stays at full opacity
  — still growing the whole time — until the MIDDLE site (index 2) has
  spawned (~2s later, matching the stagger above); only then does it
  start fading, continuing to grow as it does, over exactly one further
  stagger-interval (~1s) — finishing, fully faded and removed, precisely
  when the SECOND-INNERMOST site (index 3) spawns. Per explicit request,
  the outermost sphere must be completely gone (not just starting to
  fade) by that point. Re-timed from an earlier version whose hold phase
  ran until the innermost site spawned (~4s), which made the outer
  sphere's fade only *start* after the second-innermost site had already
  spawned — the opposite of this requirement, and impossible to satisfy
  by tweaking the fade length alone. The outer sphere's total life (~3s)
  now equals sites 1-4's own life, so all 5 sites share the same total
  lifespan; the outer sphere is simply the only one that holds before
  fading, rather than fading immediately.
- Each sphere also spins slowly about its own vertical axis for as long as
  it's alive — a full rotation takes ~45s (slowed further from an initial
  ~30s per explicit request), far longer than any pulse's lifetime, so
  each pulse only turns a sliver of a rotation before it fades, reading as
  a near-imperceptible drift rather than a spin
- Style: thin wireframe stroke, a distinct "neon blue" (`#00D4FF`, defined
  in `palette.ts` as `CONTINUOUS_PULSE_HEX` — not yet folded into this
  spec's formal two-tone STRUCTURE/THREAT palette family in §5, flagged as
  a standalone addition for this element only), additive blending
- Cosmetic and independent of `DetectionEvent` entirely — no HUD, event
  log, or data-path involvement, and no gating on status at all (unlike
  the floor Ripple system above, which is detection-gated)

## 6. Explicit non-goals

- No real camera, radar, or WiFi integration at any layer
- No database, no auth, no external API calls in the backend
- No claims, in UI copy or code comments, that this represents live or real
  sensing
- Not linked from iphysys.com or any evaluator-facing materials

## 7. Page shell

- The demo canvas becomes a hero section inside a scrollable page
  (`frontend/index.html`). Hero container: max-width ~1100px, centered,
  ~16:9 canvas (~600px tall at full width), rounded corners (~16px), 1px
  subtle border. Page background is slightly darker than the hero so the
  frame reads as a distinct panel rather than bleeding into the page.
- Brand block, HUD panels, badges, and the disclosure line all live INSIDE
  the hero frame.
- Below the hero, three short sections (static HTML/CSS, same dark theme,
  max-width matching the hero): "What this shows" (scripted
  intruder-detection scenario), "How it works" (scripted backend timeline →
  event feed → reactive scene; explicitly states all data is synthetic),
  "About" (one line: demo asset by iPhySys Labs; no product claims)
- Copy text to be supplied later — use clearly-marked placeholder copy now
