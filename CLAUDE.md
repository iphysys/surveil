# CLAUDE.md — Smart Surveillance Demo (surveil)

## Project overview

This is a marketing/demo asset, not a technical prototype in the same category
as mission-planning or swarm. It is a visually striking, scripted "intruder
detected in a no-trespassing zone" scene intended for general-audience impact
(social clips, pitch-deck opener) — NOT for evaluator due-diligence
(iDEX/TDF/DRDO).

CRITICAL: This demo uses synthetic, scripted, hardcoded detection data
throughout. There is no real sensor input, no real camera/radar/WiFi
integration of any kind, at any layer. Do not add real hardware integration,
do not add real ML inference, do not imply live sensing anywhere in code
comments, UI copy, or README.

## Tech stack

- Backend: Express + TypeScript, in-memory state only. No database. No auth.
  No external API calls.
- Frontend: Vite + TypeScript + Three.js (no React — single-scene app, no
  complex UI state)
- Deploy: backend → Render (free tier), frontend → Vercel

## Repo structure

```
surveil/
  frontend/
  backend/
  DEMO_SPEC.md
  CLAUDE.md
```

## Build order (sprints)

### Sprint 1 — Backend scaffold

- Express server with a single endpoint serving `DetectionEvent` per
  DEMO_SPEC.md §2
- Scripted sequence cycles server-side per DEMO_SPEC.md §3 timings exactly
- No frontend work this sprint

### Sprint 2 — Frontend static scene

- Three.js scene: glow blob (particle sprite, additive blending), 2 wireframe
  `SphereGeometry` shells, dark background
- HUD shell (empty/static placeholder values) matching DEMO_SPEC.md §4 layout
  and §5 palette
- Frontend polls the backend endpoint (or subscribes via SSE/WebSocket) but
  does not yet animate off the response

### Sprint 3 — Wire animation to backend state

- HUD field values update live from `DetectionEvent`
- Blob color/intensity change per `DetectionEvent.status`
  (idle/detected/escalated/resolved) per DEMO_SPEC.md §3
- Radar sweep + pulse rings driven by the same state machine, per
  DEMO_SPEC.md §5a

### Sprint 4 — Polish + deploy

- "Simulated scenario — synthetic detection feed" disclosure tag, always
  visible, non-dismissible, in all states
- Deploy backend to Render, frontend to Vercel
- Final visual QA pass against DEMO_SPEC.md §5 palette and §4 HUD layout

### Sprint 5 — Scene overhaul

- Bloom post-processing (`EffectComposer` + `RenderPass` + `UnrealBloomPass`)
  per DEMO_SPEC.md §5's amended palette entry
- Full scene recomposition per DEMO_SPEC.md §5b: auto-orbiting camera,
  ground plane with dot grid, capsule subject + particle shell, 3 wireframe
  hemisphere domes (replacing the old full-sphere shells), radar sweep and
  pulse rings laid flat on the floor around the subject
- Backend contract and state machine untouched — pure frontend visual
  refactor; all state-driven behavior still derives only from the polled
  `DetectionEvent`

### Sprint 6 — HUD + page shell

- HUD restyle per DEMO_SPEC.md §4a (monospace, brand block, SIMULATED
  badge, panel styling)
- Page shell per DEMO_SPEC.md §7: hero-framed canvas + "What this shows" /
  "How it works" / "About" sections, placeholder copy pending final text

### Sprint 7 — Lighting/art pass + HUD balance

- Two-tone STRUCTURE/THREAT palette (domes/floor/idle-sweep vs
  capsule/rings/alert-sweep/HUD accents), per DEMO_SPEC.md §5's amendment
- Bloom retuned brighter, camera brought in to frame the domes, dome
  segment/opacity/breathing pass, floor grid density + confidence-scaled
  radial tint, subject brightness/halo/twinkle-particles, vignette, and
  always-on subtle micro-motion, all per DEMO_SPEC.md §5b
- HUD EVENT LOG panel (left), bottom-center scenario pill, and value
  micro-flicker, per DEMO_SPEC.md §4a
- Frontend-only; backend contract and timeline untouched, all state-driven
  behavior still derives solely from polled `DetectionEvent`

### Sprint 8 — Composition + lifecycle + page shell

- Floor (and everything on it) rotated ~35° about world Y for a two-point
  perspective corner view; subject moved to the far/back floor corner;
  camera reframed (still fixed, no orbit) so floor + outer dome still fit,
  per DEMO_SPEC.md §5b
- Subject lifecycle rewritten: explicit spawn-grow (detected), halo-only
  pulse + cosmetic echo blips (escalated), fade-in-place (resolved),
  replacing the old persistent breathing — per DEMO_SPEC.md §5b's new
  Subject lifecycle subsection
- Page shell finalized per DEMO_SPEC.md §7: exact hero sizing, page
  background darker than the hero so it reads as a panel
- Frontend-only; backend contract and timeline untouched; echo blips are
  purely cosmetic and touch no HUD/log/data path

### Sprint 9 — Ripples + floor alignment

- Sprint 8's echo-blip system deleted entirely; only one subject exists on
  screen, ever, per DEMO_SPEC.md §5b
- Old §5a pulse rings deleted, replaced by the new Ripple system: water-wave
  rings expanding from the subject's base, dying exactly at the floor's
  left-corner radius, per DEMO_SPEC.md §5b's new Ripple system subsection
- Floor orientation re-specified with precise on-screen acceptance criteria
  (left/right corners share screen Y, back corner left-of-center, front
  corner right-of-center) replacing the old fixed "~35° yaw" wording, per
  DEMO_SPEC.md §5b's amended Floor orientation bullet
- Frontend-only; backend contract and timeline untouched; ripples are
  cosmetic and touch no HUD/log/data path

## Session rules

- Stop after each sprint. Do not begin the next sprint's tasks without
  explicit instruction.
- After completing a sprint: run a compile check (`tsc --noEmit` for both
  frontend and backend), confirm zero errors, append a session log entry to
  this file (date, sprint completed, files touched, remaining manual steps).
- Never invent field names, colors, or timings not specified in
  DEMO_SPEC.md — ask if something is missing rather than guessing.

## Session log

(append entries below as sprints complete)

### 2026-08-01 — Sprint 1 complete

Files touched:
- `backend/package.json`, `backend/tsconfig.json`, `backend/.gitignore`
- `backend/src/types.ts` — `DetectionEvent` interface, verbatim from DEMO_SPEC.md §2
- `backend/src/timeline.ts` — scripted sequence constants from DEMO_SPEC.md §3
- `backend/src/jitter.ts` — deterministic sine-based jitter helper for the escalated hold
- `backend/src/clock.ts` — server-start-relative loop clock (12s loop, no stored mutable state)
- `backend/src/sequence.ts` — `getCurrentEvent()`, five-phase state machine (idle 0–3s, detected-ramping 3–5s, escalated-hold 5–9s, resolved-hold 9–12s, loop)
- `backend/src/server.ts` — Express app, `GET /api/events`

Decisions made this sprint (both raised as open questions, resolved by user before implementation):
- Instant rows in the DEMO_SPEC.md §3 table (t=3, 5, 9) are treated as phase boundaries, not separate observable states — `distance_m` stays 38 (not 42) through the whole detected-ramping phase, and `track_id`/`zone` clear immediately at the start of resolved-hold rather than holding for one tick.
- `sensor_modality` is fixed to `"radar_sim"` for this scripted track (all three union values remain in the type per spec).

Verification:
- `npx tsc --noEmit` — zero errors
- Dev server smoke-tested via two polls of `GET /api/events`: first returned `status: "escalated"` with bearing/distance/confidence inside the §3 jitter ranges, second (6s later) returned `status: "idle"` with all fields blanked — confirms the loop advances and matches the timeline.

Remaining manual steps: none for Sprint 1. Node.js (v24 LTS) was not present on the dev machine and was installed via `winget install OpenJS.NodeJS.LTS` to run this sprint's verification.

Stopping here per session rules — Sprint 2 (frontend static scene) not started.

### 2026-08-01 — Sprint 2 complete

Files touched:
- `frontend/` scaffolded via `npm create vite@latest frontend -- --template vanilla-ts`; boilerplate demo content removed (`counter.ts`, template assets, marketing HTML/CSS)
- `frontend/package.json` — added `three`, `@types/three`
- `frontend/src/types.ts` — `DetectionEvent` interface, mirrored verbatim from `backend/src/types.ts` (no shared package between the two projects)
- `frontend/src/palette.ts` — DEMO_SPEC.md §5 palette as both Three.js numeric hex and CSS hex constants
- `frontend/src/scene.ts` — Three.js scene/camera/renderer, near-black background, resize handling
- `frontend/src/wireframeSpheres.ts` — 2 wireframe `SphereGeometry` shells (thin low-opacity strokes via `WireframeGeometry`/`LineBasicMaterial`), independent slow rotation
- `frontend/src/glowBlob.ts` — particle sprite cloud (`THREE.Points`, additive blending, canvas-generated radial-gradient texture), static idle-accent color
- `frontend/src/hud.ts` — static HUD shell DOM per DEMO_SPEC.md §4 (top banner + right panel, fields in spec order), placeholder dash values
- `frontend/src/style.css` — dark palette, HUD layout/positioning; banner hidden by default (`display:none`, matches the idle-status placeholder)
- `frontend/src/api.ts` — `pollEvents()`, polls `GET /api/events` every 1000ms (interval not spec'd, chosen), logs to console only — not yet wired to HUD/scene
- `frontend/src/main.ts` — wires scene, HUD, wireframe rotation loop, and polling together
- `backend/src/server.ts`, `backend/package.json` — added `cors` middleware (`app.use(cors())`) so the Vite dev origin can reach the API; deferred from Sprint 1 since there was no frontend yet

Decisions made this sprint (implementation-detail choices, not spec'd numeric/field values — flagged here rather than blocking, since DEMO_SPEC.md only gives qualitative guidance for these):
- Disclosure tag (`"Simulated scenario — synthetic detection feed"`) intentionally **not** added — DEMO_SPEC.md §4 lists it under HUD layout, but CLAUDE.md's build order assigns it specifically to Sprint 4 as its own line item; treated the build order as authoritative.
- Exact hex values for the idle accent (`#5b6b7a`, "muted gray/blue") and resolved accent (`#4caf7d`, "muted green") are placeholders — §5 only describes these qualitatively (unlike the background and alert-red, which are exact/family-specified). Sprint 4's "visual QA pass against §5 palette" is the explicitly scheduled place to tune these.
- Poll interval (1000ms) and glow-blob particle count/distribution are implementation details with no spec value to match.
- Blob and HUD are fully static this sprint (no idle pulse, no live field values) — Sprint 3 is where both become state-driven per the build order.

Verification:
- `npx tsc --noEmit` — zero errors, both `frontend/` and `backend/`
- Dev servers launched (`backend` on :3001, `frontend`/Vite on :5173) and driven headlessly with Playwright (chromium): screenshot confirms dark background, two rotating wireframe shells, particle glow blob at center, and the HUD panel top-right showing all 7 fields in spec order with placeholder dashes and `status: idle`; alert banner confirmed hidden (`display: none`). Console/page-error check clean except one harmless headless-GPU performance notice (`GPU stall due to ReadPixels`), environment-specific and not an app defect. Live poll logs in the console confirmed the frontend is successfully receiving real `DetectionEvent` objects from the backend across multiple status transitions.
- Playwright/Chromium isn't part of either project's dependencies — it was installed ad hoc in the session scratchpad purely to drive the one-time verification screenshot; not added to `frontend/package.json`.

Remaining manual steps: none for Sprint 2.

Stopping here per session rules — Sprint 3 (wire animation to backend state) not started.

### 2026-08-02 — Sprint 3 complete

Before implementing, surfaced a real gap (not just a bounded numeric/hex choice like prior sprints): CLAUDE.md's Sprint 3 line items referenced blob "sweep behavior" and a "radar sweep + pulse rings" element with no description anywhere in DEMO_SPEC.md. User supplied the missing spec directly rather than having it invented or skipped. Documented as new **DEMO_SPEC.md §5a** (radar sweep + pulse rings) — see that file for the exact wedge/ring parameters. Also fixed CLAUDE.md's Sprint 3 wording: removed the redundant "and sweep behavior" phrase from the blob bullet (the blob's only state-driven behavior is color/intensity, per §5) and pointed the sweep/rings bullet at §5a.

Files touched:
- `DEMO_SPEC.md` — added §5a
- `CLAUDE.md` — Sprint 3 build-order wording fix (above)
- `frontend/src/hud.ts` — added `updateHud(event)`, writes all 7 field values live, sets `data-status` on the banner, shows/formats label + timestamp
- `frontend/src/glowBlob.ts` — `createGlowBlob()` now returns `{ points, update(deltaSeconds, event) }`; color/opacity smoothly lerp toward per-status targets (idle/detected/escalated/resolved), pulse rate scales from 0.15Hz (confidence 0) to 1.2Hz (confidence 1) per §5, modulating both opacity and scale (both explicitly allowed by "opacity, and scale animation only")
- `frontend/src/radarSweep.ts` (new) — ~35° wedge, `CircleGeometry` sector, rotates clockwise (360°/3s) in all states, idle vs alert color/opacity per §5a
- `frontend/src/pulseRings.ts` (new) — 3 staggered thin-stroke `RingGeometry` rings, 1.8s shared loop / 0.6s stagger, scale 0.4x→2.2x + opacity 0.7→0, visible only during detected/escalated, per §5a
- `frontend/src/main.ts` — tracks latest polled `DetectionEvent`, drives all four update() calls (wireframes, radar sweep, pulse rings, blob) each animation frame; HUD updates directly in the poll callback
- `frontend/src/style.css` — banner visibility/color now driven by `[data-status]` attribute selectors (red for detected/escalated, green for resolved, hidden for idle)

Decisions made this sprint (implementation-detail choices where §5/§5a give no exact number — flagged, not blocking):
- Blob per-status base opacity (0.6 idle / 0.9 detected / 0.95 escalated / 0.75 resolved) — §5 only says "intensity" changes, no numbers given.
- Color/opacity transition speed (exponential approach, ~4/s) — implements the "fades back to idle gray" wording for resolved→idle; applied uniformly to all transitions for consistency.
- Pulse frequency range (0.15Hz–1.2Hz mapped to confidence 0–1) and amplitude — §5 only specifies the direction ("increases as confidence rises"), not rate bounds.
- HUD number formatting (bearing `°`, distance `m`, confidence to 2 decimals) and timestamp display (`toLocaleTimeString()`) — no format specified in §4.

Verification:
- `npx tsc --noEmit` — zero errors, both `frontend/` and `backend/`
- Dev servers launched and driven headlessly with Playwright across all four states (polled the live HUD `status` field to catch each one, not fixed sleeps): confirmed HUD values/formatting, banner visibility + color (hidden/idle, red/detected+escalated, green/resolved), blob color and pulsing, radar sweep rotating and dimming/brightening correctly, and pulse rings appearing only during detected/escalated and absent otherwise. No console/page errors (aside from the same environment-specific headless-GPU performance notice as Sprint 2).

Remaining manual steps: none for Sprint 3.

Continuing directly into Sprint 4 per explicit instruction not to stop between sprints (session rules' default stop-after-each-sprint behavior overridden for this session only).

### 2026-08-02 — Sprint 4 partial (polish done; deploy not attempted)

Files touched:
- `frontend/src/hud.ts` — added the disclosure tag markup (`.disclosure-tag`, "Simulated scenario — synthetic detection feed") to the static HUD shell, always rendered, no dismiss control
- `frontend/src/style.css` — `.disclosure-tag` positioning (bottom-right corner)

Visual QA pass against DEMO_SPEC.md §4/§5 (systematic check, not just the disclosure tag):
- §4: banner visible only when `status !== "idle"` ✓; right panel field order (sensor_modality, track_id, bearing, distance_m, confidence, zone, status) ✓; no vitals-style fields present ✓; disclosure tag bottom-right, persistent, non-dismissible, visible in all states ✓
- §5: background `#0a0d12` ✓; red family `#e24b4a` for detected/escalated ✓; wireframe spheres never react to state (confirmed `wireframeSpheres.ts` receives no event/status) ✓; blob additive blending + color shift + confidence-scaled pulse ✓; no box-shadow/blur/bloom anywhere in the CSS or materials — only opacity/scale/color animation, consistent with "no neon/glow filters" (the blob's additive blending is the one exception, and that's explicitly spec'd for the blob specifically) ✓
- §5a: resolved-state radar sweep correctly uses the idle gray-blue bucket per the user's spec (not green) — cross-checked against the exact §5a wording rather than assumed ✓; pulse rings correctly absent outside detected/escalated ✓

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- Dev servers launched, driven headlessly with Playwright across idle/escalated/resolved: disclosure tag confirmed present and visible in all three (exact text match), no regressions to Sprint 3 behavior, no console/page errors beyond the same environment-specific headless-GPU notice seen in prior sprints

Remaining manual steps:
- **Deploy backend to Render, frontend to Vercel — not attempted.** This requires the user's own hosting accounts/credentials, which aren't available in this environment, and stands up publicly-reachable infrastructure — the kind of action that needs explicit confirmation rather than being run through on the same "don't wait" instruction that covered local build steps. Flagged back to the user directly rather than guessing at account setup.

### 2026-08-02 — Sprint 5 complete (scene overhaul)

Before implementing, applied the user's spec amendments to DEMO_SPEC.md so it stays the single source of truth: §5's "no neon/glow filters" line replaced with the bloom requirement; new §5b (scene composition), §4a (HUD restyle — not yet implemented, that's Sprint 6), and §7 (page shell — likewise Sprint 6) added. CLAUDE.md's build order got new Sprint 5/6 entries mirroring the existing format.

Files touched:
- `DEMO_SPEC.md` — §5 amendment, added §5b/§4a/§7
- `CLAUDE.md` — Sprint 5/6 build-order entries (above)
- `frontend/src/scene.ts` — rewritten: `EffectComposer` + `RenderPass` + `UnrealBloomPass` (strength 0.9 / radius 0.6 / threshold 0.2, per §5) + `OutputPass`; sizing now driven by the container's `ResizeObserver` instead of `window` resize (more correct once Sprint 6 wraps the canvas in a smaller hero frame); returns `render()` (calls `composer.render()`) instead of exposing the raw renderer
- `frontend/src/cameraRig.ts` (new) — fixed 35° elevation, auto-orbit 360°/90s, looks at a fixed point above the floor; distance/look-at height aren't spec'd numerically, tuned visually
- `frontend/src/subject.ts` (new, replaces `glowBlob.ts`) — capsule (`THREE.CapsuleGeometry`) + additive particle shell, both driven by the same color-lerp/pulse system carried over from the old blob; idle target intensity is now 0 (fully hidden, per §5b) instead of the old dim-but-visible idle state; exposes `getColor()`/`getIntensity()` so other modules can stay in sync without duplicating the lerp
- `frontend/src/domes.ts` (new, replaces `wireframeSpheres.ts`) — 3 wireframe hemispheres (`SphereGeometry` with `thetaLength = Math.PI/2`), radii 1.5x/2.2x/3x subject height, independent slow Y rotation, state-independent (unchanged from the old full-sphere shells' "not tied to detection state" behavior)
- `frontend/src/groundPlane.ts` (new) — dark floor (`PlaneGeometry`) + 40×40 dot grid (`THREE.Points`, per-vertex colors) tinting toward the subject's current color/intensity by distance falloff
- `frontend/src/radarSweep.ts`, `frontend/src/pulseRings.ts` — reworked to lie flat on the floor (static `rotation.x = -Math.PI/2` on the mesh, spin/position applied to a wrapping group) and center on the subject instead of billboarding to camera; timing/color logic from §5a unchanged
- `frontend/src/main.ts` — rewired for the new module set; removed `wireframeSpheres`/`glowBlob` imports

Decisions/observations flagged for your visual check (not spec'd numerically, or worth a second look before Sprint 6):
- **"Instanced points" implemented as a single `THREE.Points` cloud**, not literally `THREE.InstancedMesh` — visually equivalent for flat dots, one draw call, much cheaper. Say if you want the literal API.
- Subject is fixed at the scene origin — bearing/distance from `DetectionEvent` are displayed in the HUD as before but don't reposition the 3D subject (§5b doesn't ask for that, and there's no spec'd world-scale mapping from meters/degrees to scene units).
- Scene scale (subject height 1.4 units, dome radii 2.1/3.08/4.2, ground 12×12, camera distance 13) and bloom's visible effect: **the alert-state sweep wedge (opacity 0.12, radius 5) plus bloom produces a fairly strong ambient red wash across the frame during detected/escalated** (visible in the screenshots) — this follows directly from the spec's own numbers (sweep opacity, bloom strength/threshold), not a deviation, but flagging it since it's a strong look and bloom is explicitly called out as "tune visually."
- Capsule uses `MeshStandardMaterial` with `emissive`/`emissiveIntensity` (not `MeshBasicMaterial`) so it reads as "emissive" literally and stays bright with zero scene lights — no lighting rig was added (none spec'd).

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- Dev servers launched, driven headlessly with Playwright across all four states: screenshots confirm the capsule shows/hides and colors correctly (hidden idle → red detected/escalated with visible bloom → brief green resolved), 3 hemisphere domes render and stay state-independent, ground dot grid and floor visible, pulse rings and floor-flat sweep both animate and gate on detected/escalated correctly. No console/page errors beyond the same environment-specific headless-GPU notice seen in every prior sprint. Camera auto-orbit and bloom pass both confirmed active (single frames only — didn't verify the 90s orbit period or bloom parameter tuning frame-by-frame; worth a live look with `npm run dev`).

Remaining manual steps: none for the code itself, but per session rules this needs your visual confirmation (`npm run dev`, live look) before Sprint 6 (HUD + page shell) begins.

STOPPING per explicit instruction — Sprint 6 not started, awaiting confirmation the scene looks right.

### 2026-08-02 — Sprint 6 complete (HUD restyle + page shell)

User confirmed Sprint 5 and said to run the remaining sprints without stopping in between. Sprint 6 was the only one left in the build order, so this closes out everything currently defined except deploy.

Files touched:
- `frontend/index.html` — rewritten: `.page` wrapper (max-width 1100px) containing `.hero-frame` (rounded, bordered, `aspect-ratio: 16/9`, holds the existing `#app` mount point) followed by 3 static `.info-section` blocks ("What this shows", "How it works", "About") per §7, each with placeholder copy and a visible "PLACEHOLDER COPY" marker badge next to the heading
- `frontend/src/hud.ts` — added the top-left brand block (`iPhySys` + subtitle) and a `.top-right-stack` wrapping a `SIMULATED` pill above the existing field panel; panel now has an uppercase "Detection feed" header row; `updateHud()` also stamps `data-status` onto the panel (not just the banner) so field values can accent-color
- `frontend/src/style.css` — full restyle: page-shell layout (was previously a 100vw/100vh kiosk overlay, `body` no longer forces `overflow:hidden` so the page scrolls), monospace font stack scoped to `.hud`, uppercase letter-spaced labels, right-aligned + state-accent-colored values, rounded-corner/translucent/bordered "panel" chrome applied consistently to both the banner and field panel, brand block / SIMULATED pill / placeholder-marker styles

Decisions made this sprint (implementation details not pinned down by §4a/§7 — flagged, not blocking):
- Hero frame aspect ratio (16:9) isn't spec'd — chosen as a reasonable default for a "hero section."
- Interpreted "Panels: dark translucent background, 1px subtle border, rounded corners" as the shared chrome for *all* boxed HUD elements (banner included), not just the field panel — kept the banner's existing status-color logic but gave it the same rounded/translucent treatment for visual consistency.
- "Top-right: a pill badge" is rendered stacked directly above the field panel (not merged into the panel header) since the spec lists them as separate bullets — reads as two distinct elements sharing the top-right zone.
- Placeholder copy for the 3 info sections was written now (clearly marked with a badge) since §7 explicitly expects placeholder text pending your final copy — happy to swap in real copy whenever you have it, just say the word.
- No changes to `scene.ts`'s sizing logic were needed — the `ResizeObserver`-on-container approach built in Sprint 5 already adapts correctly now that the canvas's container is the bounded `.hero-frame` instead of the full viewport.

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- Dev servers launched, driven headlessly with Playwright: full-page screenshot at idle confirms the hero frame + all 3 sections with placeholder badges render correctly below it; a second screenshot at escalated confirms the brand block, SIMULATED pill (present and unchanged across states), monospace uppercase panel with "Detection feed" header, and red-accented field values all render together correctly. Page max-width confirmed 1100px via computed style. No console/page errors beyond the same environment-specific headless-GPU notice seen in every prior sprint.

Remaining manual steps:
- Final copy for the 3 info sections, whenever you have it (currently placeholder, clearly marked).
- **Deploy backend to Render, frontend to Vercel — still not attempted**, same reasoning as Sprint 4/5 (needs your hosting accounts/credentials, stands up public infrastructure, out of scope for an unattended "run the sprints" pass).

This is everything currently in the build order except deploy. Stopping here — let me know if you want to review it live first, want the deploy step walked through, or want to define further sprints.

### 2026-08-02 — Sprint 7 complete (lighting/art pass + HUD balance)

Applied the user's spec amendments to DEMO_SPEC.md before implementing: §5's palette section rewritten around a two-tone STRUCTURE (`#7A8FA6` family) / THREAT (`#E24B4A` family) scheme and retuned bloom numbers; §5b amended in place (camera framing, ground grid density/tint, subject brightness/halo/twinkle, dome segments/opacity/breathing) plus new vignette and micro-motion bullets; §4a amended with the EVENT LOG panel, scenario pill, and value-flicker requirement. CLAUDE.md got a new Sprint 7 build-order entry.

Files touched:
- `DEMO_SPEC.md` — §5, §5b, §4a amendments (above)
- `CLAUDE.md` — Sprint 7 build-order entry
- `frontend/src/palette.ts` — `IDLE_ACCENT_HEX`/`_CSS` renamed to `STRUCTURE_ACCENT_HEX`/`_CSS` (`#7a8fa6`), reflecting the two-tone scheme rather than a per-status "idle" concept
- `frontend/src/domes.ts` — structure color, segments raised to 48x24, opacity raised to [0.35, 0.26, 0.18], added per-dome "breathing" scale oscillation (3% amplitude, 4s period, phase-offset by dome index)
- `frontend/src/radarSweep.ts` — idle-bucket color renamed to the structure accent (logic otherwise unchanged)
- `frontend/src/groundPlane.ts` — grid raised to 64x64, base dot color now derived from the structure accent at raised brightness (`multiplyScalar(0.55)`) instead of an unrelated hardcoded dark gray, and the tint model rewritten: `update()` now takes `(subjectPosition, confidence)` instead of `(subjectColor, subjectIntensity)` and blends a fixed red threat tint in by distance-falloff × confidence, fading to the structure-toned base beyond the falloff radius
- `frontend/src/subject.ts` — `EMISSIVE_INTENSITY_SCALE` raised 2.2 → 4.5 so the capsule dominates bloom; added a `THREE.Sprite` halo (~3x capsule width, additive) and an 80-particle twinkle cluster (`THREE.Points`, per-particle sinusoidal position drift + per-particle brightness-flicker via vertex colors, since `PointsMaterial` has no per-vertex alpha) — both tied to the same color/intensity system as the capsule and shell, so they're hidden in idle and colored consistently in every other state; also now exports `SUBJECT_RADIUS`
- `frontend/src/scene.ts` — bloom strength 0.9→1.4, threshold 0.2→0.1 (radius unchanged); added a `ShaderPass(VignetteShader)` as the final composer pass
- `frontend/src/cameraRig.ts` — distance 13→10.5, solved from the ~50° vertical FOV against the outer dome's radius (≈4.2) to land the dome at ~85-90% of viewport height, then confirmed visually
- `frontend/src/main.ts` — updated `ground.update()` call site for the new `(subjectPosition, confidence)` signature
- `frontend/src/api.ts` — poll interval 1000ms → 400ms so HUD values visibly tick per the micro-flicker requirement
- `frontend/src/hud.ts` — added the left EVENT LOG panel (tracks `event.status` transitions internally, formats `"HH:MM:SS STATUS track_id zone N"`, caps at 6 rows with a per-row opacity fade for older entries) and the bottom-center scenario pill; no other structural change
- `frontend/src/style.css` — `.event-log-panel`/`.event-log-row`/`.scenario-pill` styles

Decisions/interpretations flagged (implementation choices where the amendment gives a target but not an exact mechanism — flagged per this project's ask-don't-guess practice, not blocking):
- **"~2x subject radius" for the ground tint falloff** is read as 2x the subject's overall height (2.8 units), not 2x the capsule's own ~0.25-unit cross-sectional radius — the literal radius value would make the tint nearly invisible against the 12x12 floor. Worth a look if you want it tighter/looser.
- **HUD value micro-flicker** was satisfied by tightening the poll interval (1000ms→400ms) rather than adding new client-side jitter — the backend's existing escalated-hold jitter and detected-ramping already produce different bearing/distance/confidence values on every poll; polling more often makes that visibly "tick" rather than step once a second. No backend changes, consistent with the sprint's frontend-only scope.
- **"Floor-adjacent particle drift" in the micro-motion bullet** is read as the twinkle cluster (which sits near the subject, which stands on the floor), not a separate always-on ambient dust system across the whole ground grid — the twinkle cluster is tied to subject intensity (so it's dark/inactive in idle, matching the capsule's own "idle: hidden" rule); idle's continuous motion instead comes from dome breathing (unconditional, all states) and the ever-rotating radar sweep.
- **Vignette strength** (`offset=0.85`, `darkness=0.7`) was solved analytically to ~25% corner darkening for a bright corner pixel, then eyeballed against the rendered screenshots rather than pixel-measured — flagged since it's the one piece of this sprint not independently verified with a hard measurement, only visual plausibility + code review of `VignetteShader`'s math.
- **"Top-right... a pill badge" vs. left "EVENT LOG panel"** — followed the existing Sprint 6 precedent of treating listed HUD zones as literal, separate elements rather than merging them.

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- Dev servers launched, driven headlessly with Playwright across a full idle → detected → escalated → resolved loop (polled live HUD status to catch each phase, not fixed sleeps): screenshots confirm all three acceptance criteria from this sprint's instructions — (a) wireframe domes visibly bloom (soft blue-white glow, clearly stronger than Sprint 5/6's screenshots), (b) the capsule is unmistakably the brightest object on screen during detected/escalated (blown-out white-red core against the softer dome glow), (c) structure (cool blue-gray, idle/resolved) and threat (hot red, detected/escalated) read as two distinct color families at a glance, confirmed by direct comparison of the idle and escalated screenshots. Also confirmed: outer dome now fills nearly the full frame height: EVENT LOG panel populates and orders newest-first with the exact format from the spec's example; scenario pill present with exact spec'd text in all four states; disclosure tag and SIMULATED pill unaffected; no console/page errors beyond the same environment-specific headless-GPU notice seen in every prior sprint.
- Dome breathing and the vignette's precise strength were verified by code review + visual plausibility only, not frame-by-frame or pixel measurement — both are subtle-by-design and a single screenshot can't capture oscillation over time.

Remaining manual steps: none for the code itself. Deploy to Render/Vercel remains outstanding, same reasoning as every prior sprint.

STOPPING per explicit instruction — no further work begun.

### 2026-08-02 — Sprint 7 follow-up: fixed camera (auto-orbit removed)

Applied the user's spec amendment to DEMO_SPEC.md §5b's Camera bullet first: auto-orbit deleted, camera now fully stationary at the elevation/distance already tuned in Sprint 7; explicit note that the floor must never appear to rotate.

Files touched:
- `DEMO_SPEC.md` — §5b Camera bullet rewritten (stationary, no orbit); Domes bullet also amended (below)
- `frontend/src/cameraRig.ts` — rewritten from a stateful `createCameraRig(camera): { update }` to a one-shot `positionCamera(camera): void`; sets position/lookAt once at the same elevation (35°) and distance (10.5) as Sprint 7's tuned framing, no per-frame azimuth increment, `ORBIT_PERIOD_S` removed entirely
- `frontend/src/main.ts` — calls `positionCamera(camera)` once at setup instead of holding a `cameraRig` and calling `.update(delta)` every frame
- `frontend/src/domes.ts` — removed the per-dome Y-rotation (`ROTATION_SPEEDS_RAD_S` and the `rotation.y +=` line); kept the breathing scale oscillation unchanged
- `DEMO_SPEC.md` — Domes bullet in §5b also amended: "slow independent rotation about y" removed, replaced with a note explaining why (visible against the now-fixed camera) and pointing at the Camera bullet/micro-motion rule

Why the dome rotation also came out: the instructions asked me to check empirically ("if any dome mesh seam or irregularity becomes visible as rotation, remove") rather than assume either way, since a wireframe grid only has discrete (48-fold) rotational symmetry, not continuous symmetry — spinning it is generically visible even though the underlying hemisphere shape is radially symmetric. I verified this with a pixel-diff rather than eyeballing:
- First pass (rotation still present): diffed two same-region crops of the outer dome's wireframe, but the two source frames spanned an idle→escalated status change, so the ~3.9% mismatch was confounded by the ambient bloom/background tint shift between those states, not just rotation.
- Redid it controlled: caught two frames both still tagged `status: "escalated"` (1.4s apart, so the ambient tint is constant), diffed the same crop — 3.89% dropped to 0.41%, and the diff image changed from a dense cross-hatch covering the whole wireframe interior to a sparse scatter confined to the dome's outer rim (consistent with the 3%-amplitude breathing scale nudging the edge by a couple pixels, not rotation).
- Confirmed floor-dot position stability directly too: cropped a floor-dot region in the idle vs. escalated frame pair and got only a small diff attributable to the (intentional, spec'd) confidence-scaled red tint reaching that area — moot anyway, since `groundPlane.ts`'s dot positions are written once into a `BufferAttribute` at construction and no code path ever touches `position` again after that, only `color`; the floor cannot move by construction, independent of any pixel test.

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- Dev servers launched, driven headlessly with Playwright across a full idle → detected → escalated → resolved loop: no console/page errors beyond the usual environment-specific headless-GPU notice; scene composition (bloom, capsule brightness, structure/threat color split, EVENT LOG, scenario pill) all confirmed unaffected by this change via a fresh full-loop screenshot pass
- Camera fixed: confirmed via direct visual comparison (identical dome/floor silhouette position across an idle→escalated frame pair 6s apart) and by code review (`positionCamera` is called exactly once, never inside the animation loop)
- Dome rotation removed: confirmed via the controlled same-status pixel-diff above (9x reduction in mismatch, dense interior cross-hatch → sparse rim-only scatter)
- Floor never rotates: confirmed both empirically (low residual diff, attributable to intentional tint, not position) and by construction (dot/floor positions are write-once)

Remaining manual steps: none. Deploy to Render/Vercel remains outstanding, unchanged from every prior sprint.

STOPPING per explicit instruction.

### 2026-08-02 — Sprint 8 complete (composition + lifecycle + page shell)

Applied the user's spec amendments to DEMO_SPEC.md first: §7 rewritten with exact hero sizing (max-width 1100px, ~16:9, ~600px tall, 16px corners, page background darker than the hero panel) and an explicit note that HUD elements live inside the hero frame; §5b amended with a new "floor orientation" bullet (corner-on, two-point perspective), the Subject bullet rewritten for the back-corner position, and a new "Subject lifecycle" subsection (spawn-grow / halo-pulse+echoes / fade-in-place) replacing the old always-on breathing; the Domes and Micro-motion bullets updated to reference the new lifecycle instead of the old breathing model. CLAUDE.md got a new Sprint 8 build-order entry.

Files touched:
- `DEMO_SPEC.md` — §7, §5b amendments (above)
- `CLAUDE.md` — Sprint 8 build-order entry
- `frontend/src/style.css` — page/body background changed to `#06080b` (darker than the hero's `#0a0d12`) so the hero frame reads as a distinct panel rather than bleeding into the page
- `frontend/src/groundPlane.ts` — `GROUND_SIZE` now exported (main.ts needs it to compute the subject's corner position without duplicating the magic number)
- `frontend/src/subject.ts` — rewritten around an explicit `Phase` state machine (`hidden`/`growing`/`held`/`fading`) replacing the old continuous color/intensity-lerp "breathing": `detected`/`escalated` trigger a 0.8s ease-out spawn (capsule `scale` literally animates 0→1, not just opacity), `held` phase now applies pulse to the halo's opacity only (capsule itself stays visually steady) and, when `status === "escalated"`, spawns cosmetic echo-blip sprites (1.2-2s randomized interval, max 2 alive, 0.6s grow + 0.8s fade, positioned randomly within 1.5 subject-heights); `resolved` triggers a 1s linear fade-in-place for both the subject and any live echoes (echoes get a `forcedFade` override that freezes their size and fades from whatever size they'd already reached, rather than continuing their own grow/fade curve); `idle` hard-resets everything to hidden and clears all echoes. Twinkle-cluster drift/flicker now runs off a separate never-resetting clock (`elapsedS`) instead of the phase-local timer (`phaseElapsed`) — using the phase timer there would have made all 80 particles visibly snap in sync at every phase transition, caught before testing via code review, not by observation.
- `frontend/src/cameraRig.ts` — `DISTANCE` reframed 10.5 → 12.5 (elevation/look-at height otherwise unchanged) to fit the new off-center, corner-on composition
- `frontend/src/main.ts` — added a `worldGroup` (rotated 35° about Y once, at setup) containing the floor, subject, domes, sweep, and rings, so the whole composition — not the camera — is what presents a floor corner to the fixed camera; subject position moved from scene origin to 75% of the way toward a back floor corner (in the floor's own local space, before the group rotation)

Decisions/interpretations flagged (implementation choices where the amendment gives a target but not an exact mechanism — flagged per this project's ask-don't-guess practice, not blocking):
- Chose to rotate the composition's parent group rather than the camera's azimuth, per the amendment's own first-listed option — keeps `cameraRig.ts` exactly as simple as last sprint's fix left it (position set once, never touched in the render loop).
- Camera `DISTANCE` (12.5) is a visually-tuned value with no spec'd number to match — the amendment only asks that "the full floor and outer dome still fit comfortably," which doesn't reduce to a single formula the way Sprint 7's centered-dome framing did (that had an exact "85-90% of viewport height" target to solve for; this one doesn't, given the composition is now off-center by design).
- Echo blip size ("~25% of subject size") is read as 25% of the capsule's width (`2 × SUBJECT_RADIUS`), not its height or the halo's diameter — the capsule's cross-section is the most natural "subject size" reference for a small companion blip.
- Fade/echo timing (0.8s grow, 1s fade, 1.2-2s echo interval, 0.6s/0.8s echo grow/fade) implemented exactly as given rather than re-tuned, since the instructions called these "starting points" but didn't flag them as needing adjustment, unlike the camera distance which had no numeric starting point to begin with.

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- Camera framing/floor orientation confirmed visually: a floor corner faces the camera with edges receding diagonally (two-point perspective), the subject sits clearly off-center toward the back rather than floor-center, and the full floor + outer dome fit within the frame with comfortable margin in every state tested (idle/detected/escalated/resolved)
- **Subject fade timing verified precisely, not just by eye**: initial screenshot-based checks made the resolved fade look instantaneous, which turned out to be a measurement artifact — `page.screenshot()` calls in this environment take ~850-1000ms+ each (measured directly), longer than the entire 1s fade, so by the time any screenshot-based capture completed, the fade had often already finished. Re-verified with a temporary console-log of the fade envelope's value every frame (added, checked, then removed): confirmed a smooth linear decay from 0.81 at t=0.19s down to 0.00 at t≈1.0s — correct, matches spec, no snapping.
- **Echo blip isolation verified precisely**: attempted a WebGL pixel-sampling approach first, which came back unreliable (the renderer isn't created with `preserveDrawingBuffer`, so a separately-drawn 2D copy of the canvas reads stale/empty data) — abandoned that method rather than trust a broken signal. Used a temporary console-log (added, checked, then removed) instead: watched ~26s (just over 2 full 12s loops, since echo spawn timing is randomized) and confirmed 4 spawns, all with `status === "escalated"` and `phase === "held"`, and zero occurrences of an echo existing outside that window (including immediately after `resolved`/`idle`, where the forced-fade and hard-clear paths respectively are supposed to handle them).
- **Echo isolation from the data path** confirmed by `grep -r "echo" frontend/src` — the only match anywhere in the codebase is `subject.ts` itself; `hud.ts`, `api.ts`, and `main.ts` have zero references, confirming echoes never touch the event log, HUD fields, or any `DetectionEvent`-derived state.
- Dev servers driven headlessly with Playwright across two full loops: full-page screenshot confirms the hero frame reads as a distinct panel (page bg `rgb(6,8,11)` vs. hero bg `rgb(10,13,18)`, computed-style-verified) sized exactly 1060×596px (16:9, ~600px tall) at this viewport width, with the three info sections below at matching max-width; per-state screenshots confirm idle shows no subject at all, detected/escalated show the grown-in glowing capsule with visible halo, and resolved fades correctly. Zero console/page errors beyond the same environment-specific headless-GPU notice seen in every prior sprint.

Remaining manual steps: none for the code itself. Deploy to Render/Vercel remains outstanding, unchanged from every prior sprint.

STOPPING per explicit instruction — dev servers stopped, no further work begun.

### 2026-08-02 — Sprint 9 complete (ripples + floor alignment)

Applied the user's spec amendments to DEMO_SPEC.md first: Subject lifecycle's escalated bullet stripped of the echo-blip paragraph (with a note that they're deleted, not replaced); §5a's old Pulse rings subsection marked SUPERSEDED (kept only as a historical marker); a new "Ripple system" subsection added to §5b with the exact spawn/expand/death-radius/style rules; the Floor orientation bullet rewritten around the precise on-screen corner conditions (replacing the old fixed "~35°" wording); the Domes and Micro-motion bullets' cross-references updated from "sweep/rings"/"echo blips" to "sweep/ripples". Caught and fixed my own mistake mid-edit: I initially also stripped the twinkle particle cluster from the Subject bullet, conflating it with the echo-blip deletion — the amendment only asked to delete echo blips (a Sprint 8 addition), not the twinkle cluster (an unrelated Sprint 7 system); restored it before moving on. CLAUDE.md got a new Sprint 9 build-order entry.

Files touched:
- `DEMO_SPEC.md` — amendments above
- `CLAUDE.md` — Sprint 9 build-order entry
- `frontend/src/subject.ts` — removed the entire echo-blip system (constants, `Echo` interface, `spawnEcho`/`clearEchoes`/`echoGrowFraction`, the status-transition echo handling, the per-frame echo update loop); everything else (grow/hold/fade phase machine, halo pulse, twinkle cluster) untouched
- `frontend/src/pulseRings.ts` — deleted
- `frontend/src/ripples.ts` (new) — water-wave ring system: emits one ripple every 1.4s while detected/escalated, each expanding at a constant speed derived from `deathRadius / 2.75s` (so life stays "~2.5-3s" regardless of the caller's specific death radius), opacity linear 0.6→0, ring geometry regenerated each frame (not scaled) so stroke width stays constant in world units as the ring grows, removed exactly at `deathRadius`; a defensive idle-transition clear on top of the natural timing (ripple life ~2.75s < resolved-hold's 3s, so ripples should already be gone by idle, but the spec's "no ripples in idle" is enforced directly rather than relied on via timing coincidence)
- `frontend/src/groundPlane.ts` — no functional change (still takes `subjectPosition`/`confidence`); referenced here only because `GROUND_SIZE` (already exported since Sprint 8) is what `main.ts` now uses to compute the ripple death radius
- `frontend/src/cameraRig.ts` — `DISTANCE` 12.5→12.2, `LOOK_AT` (0,1,0)→(0,1,-0.3); see the long doc comment in this file for the full derivation
- `frontend/src/main.ts` — `FLOOR_ROTATION_DEG` 35→46.7 (solved, not just visually eyeballed — see below); ripple death radius computed from `subjectPosition.distanceTo(leftCornerLocal)` rather than hardcoded, since it's a real geometric quantity, not a free parameter; wired `createRipples` in place of `createPulseRings`

**The floor-orientation solve was the bulk of this sprint's effort and surfaced a genuine mathematical tension**, not just a "tune visually" knob-turn:
- Proved analytically that for a perfectly Z-symmetric camera (Z=0 position AND Z=0 look-at — what every prior sprint used) the two acceptance conditions can only coincide exactly at ONE degenerate yaw, where the back/front offset is exactly zero: rotating a square's two perpendicular half-diagonals under a fixed linear (camera) map traces two ellipses 90° out of phase, and they only match in Y where their X-components are simultaneously forced to 0. Confirmed this numerically too (swept yaw 0-360° at the original camera settings — `left.ndcY - right.ndcY` hits exactly 0 only at yaw=45°/225°, where `back.ndcX`/`front.ndcX` are also exactly 0).
- Broke the symmetry with a small `LOOK_AT.z` tilt (camera position itself never moves off `Z=0`, matching "camera stays fixed"). Found near-perfect fits (score ~0.001, i.e. ~0.3px) but only at a much closer camera distance (~7-8) — checked the actual clip-space `w` for all 4 corners at that distance and found the floor's front corner projects with **negative w — literally behind the camera's near plane**, an invalid/degenerate configuration, not just an aggressive one. Screenshotted it anyway to be sure: the dome overflowed the frame edges, confirming it wasn't just a math artifact.
- Re-searched requiring every corner to have `w > 1` (comfortably in front of the camera) and distance close to Sprint 8's 12.5: best found was distance=12.2, yaw≈46.7°, `LOOK_AT.z`≈-0.3, residual left/right mismatch ≈0.10 NDC (~30px at this canvas size) — clearly better than doing nothing (which would be ~65px) but short of the spec's "within a few px." This is the value shipped.
- This is a flagged, deliberate compromise, not a claim of exact conformance: prioritized a comfortable, non-degenerate camera (no clipping risk, framing quality close to Sprint 8's) over chasing the last ~25px of a match that only exists in a broken camera configuration. Full derivation is documented in `cameraRig.ts`'s doc comment for future reference.
- All of this was done with a temporary debug hook (`window.__sprint9.corners()`, exposing the real camera's `.project()`) plus, once patterns emerged, a pure-math Node replica of the same projection (validated to match the live-measured values before trusting it) for fast wide/fine grid search — both removed from the shipped code before finishing.

Decisions/interpretations flagged (implementation choices where the amendment gives a target but not an exact mechanism):
- Ripple "death radius" ("distance from the subject's base to the floor's LEFT corner") computed as a real geometric distance (`Vector3.distanceTo`) between the subject's local position and the local (-6,+6) corner — not a tuned/arbitrary constant. Because rotation preserves distances within a rigid group, this value (≈10.61 units) is independent of `FLOOR_ROTATION_DEG`, so it didn't need re-deriving each time the yaw solve changed.
- Ripple geometry is regenerated (a fresh `RingGeometry` per ripple per frame, old one disposed) rather than scaled, specifically so "ring width stays constant as it expands" is literally true in world units — uniform-scaling a fixed-proportion ring (the old pulse-rings approach) would have made the stroke grow thicker as the ring grows, which the spec explicitly rules out.

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- `grep -r "echo" frontend/src` — only match is a doc-comment in `subject.ts` noting the deletion; zero actual echo code anywhere, zero references in `hud.ts`/`api.ts`/`main.ts`
- `grep -r "pulseRings"` — no matches anywhere, old module fully removed
- Dev servers driven headlessly with Playwright across two full 12s loops: confirmed exactly one subject visible at any time across every state, no secondary blips ever; confirmed ripples spawn only during detected/escalated, expand cleanly from the subject's base, and — caught directly in a resolved-phase screenshot — a ripple still finishing its expansion toward the death radius while the subject fades to green, exactly matching "no new ripples and any live ones finish their expansion naturally while the subject fades"; confirmed idle shows zero subject and zero ripples in every cycle, including a second full loop with no state leaking across the boundary; zero console/page errors beyond the same environment-specific headless-GPU notice seen in every prior sprint.

Remaining manual steps: none for the code itself. The floor-orientation fit is a documented compromise (see above) — worth a look if you want to push closer to "a few px" at the cost of a tighter/different camera framing. Deploy to Render/Vercel remains outstanding, unchanged from every prior sprint.

STOPPING per explicit instruction — dev servers stopped, no further work begun.

### 2026-08-02 — Sprint 9 bugfix: ripple regression, diagnosed and partially resolved

Bug report: the ripple appeared as an ellipse spanning nearly the full frame width and still visible ~4s after spawning near an escalated transition, against the spec's "dies at the left-corner distance, ~2.5-3s life" target. The report's working hypothesis was that the wrong floor corner (right instead of left) had been picked as `LEFT_CORNER_LOCAL`.

**Step 1 diagnosis (temporary logging, per instruction, done before any fix):** Logged all 4 floor corners' world position and camera-projected NDC x/y at scene init, the subject's world position, `LEFT_CORNER_LOCAL` and the resulting `rippleDeathRadius`, and each ripple's actual radius + measured life at removal.

Logged values:
- Corner `(-half,+half)` [local (-6,0,6), the existing `LEFT_CORNER_LOCAL`]: world=(0.252,0,8.482), **ndc.x=-0.900** — the most negative (leftmost) of all 4 corners.
- Corner `(+half,-half)` [local (6,0,-6)]: world=(-0.252,0,-8.482), ndc.x=0.781 — the rightmost.
- Corner `(-half,-half)` [back, nearest the subject]: ndc.x=-0.050, ndc.y=0.386.
- Corner `(+half,+half)` [front, nearest the camera]: ndc.y=-2.283 — off-screen, below the visible frame entirely.
- Subject world=(-6.361,0,0.189).
- `LEFT_CORNER_LOCAL=(-6,0,6)`, `rippleDeathRadius=10.607`.
- 4 ripple removals logged: radius 11.15–11.49 (a few % over `deathRadius`, explained by per-frame overshoot at this environment's low/variable headless frame rate — the `>= deathRadius` check only fires after that frame's increment), measured life 2.36–2.50s (short of the 2.75s target by roughly one frame's worth of delta, traced to a measurement artifact in the temporary logging itself — the newly-spawned ripple gets its first radius increment in the same frame it's created, one frame before the life clock's reference point — not a bug in the shipped speed formula).

**Conclusion: the bug report's hypothesis did not hold.** `LEFT_CORNER_LOCAL` was already the correct, visually-left corner (ndc.x=-0.900, unambiguously the most negative/leftmost of the 4), and the expansion-speed formula (`speed = deathRadius / LIFE_S`) was already keeping ripple life within measurement noise of the 2.75s target. The real cause of "spans nearly the full frame width" is geometric, not a coding defect: the subject sits ~75% of the way toward the floor's *back* corner (per §5b, Sprint 8), so its distance to either *side* (left/right) corner is a real ≈10.6 units — large relative to the 12-unit floor — and a ripple correctly computed and correctly timed against that distance is inherently large on screen. Re-verified live post-fix with a fresh frozen-frame screenshot ~2.5s into a resolved-hold: a ripple spawned during the preceding escalated phase is still clearly present, large, and only partially faded — consistent with the (correct, per spec) ~2.75s life carrying past the status transition, not a leak or infinite-growth bug.

**Step 2 fix applied:** `LEFT_CORNER_LOCAL` was a hand-picked local constant that happened to be correct for the current `FLOOR_ROTATION_DEG`/camera framing but was fragile against any future retune (exactly the failure mode the bug report suspected, even though it hadn't actually occurred yet). Replaced it in `frontend/src/main.ts` with a corner picked by actually projecting all 4 floor corners through the real camera (`Vector3.project(camera)`, after `worldGroup.updateMatrixWorld(true)` / `camera.updateMatrixWorld(true)`) and taking the one with the smallest screen-space NDC x — i.e. picked by where it actually lands on screen, not by name/index. The expansion-speed scaling (`speed = deathRadius / LIFE_S` in `frontend/src/ripples.ts`) was already exactly the fix Step 2 asked for and needed no change. Net effect: `rippleDeathRadius` is numerically unchanged (≈10.607, same corner), so the large-ripple visual is unchanged too — this is flagged as an open question below, not silently accepted.

Files touched:
- `frontend/src/main.ts` — corner selection hardened (camera-projected, not hand-picked); temporary diagnostic logging added then fully removed
- `frontend/src/ripples.ts` — temporary diagnostic logging (per-ripple spawn/removal radius+life) added then fully removed; no functional change, confirmed via `git diff` showing zero net diff on this file

**Step 3 — dome count:** Confirmed exactly 3 domes via a temporary `window.__domeCount` hook reading `domes.group.children.length` at runtime (removed after the check) — matches `domes.ts`'s `RADIUS_MULTIPLIERS = [1.5, 2.2, 3.0]`, untouched by this bugfix. Visually, a zoomed crop of the idle screenshot's dome-base region shows 2 clearly separated concentric rim lines plus a third partially merged into the bloom-bright crown where the domes nest most closely — all 3 are present and distinguishable at the base/rim, though the innermost is harder to pick out near the top where bloom is strongest.

**Step 4 — floor legibility:** Honest read, no border added (per instruction). The floor's corners are not reliably inferable from the dot field alone. Cross-checked against the Step 1 NDC log: the front corner (nearest the camera) projects at ndc.y=-2.283 — literally outside the visible viewport — so at most 3 of the floor's 4 corners are ever on screen at all, and none of those 3 are marked by a density spike, color break, or hard edge; the dot grid is uniform-density and, at idle specifically, uniform-*color* too (the confidence-scaled red tint's blend factor is `falloff × confidence`, and confidence is 0 at idle, so there's zero tint variation across the whole grid in this state). The grid reads as a soft, gradually-thinning field rather than a legible rectangle with identifiable corners.

Verification:
- `npx tsc --noEmit` — zero errors, both `backend/` and `frontend/`
- `grep -r "DIAG\|totalElapsed\|spawnedAt" frontend/src/ripples.ts` — no matches, temporary diagnostics fully removed; `git diff` confirms zero net change to this file
- Dev servers driven headlessly with Playwright (screenshot latency in this environment is severe — calibrated at ~10s per screenshot call under bloom+vignette software rendering — so verification used an in-page technique that overrides `window.requestAnimationFrame` to freeze the canvas the instant a target status is observed, avoiding the screenshot call itself racing the 3s idle window or drifting the captured frame across a status boundary): confirmed 3 domes present (runtime count) and visually distinguishable at their base rims in a frozen, zoomed idle capture; confirmed the ripple genuinely dies (never seen crossing `deathRadius`, consistent with the `>= deathRadius` removal check) but remains large and can visibly persist into early resolved-hold, exactly matching the bug report's original visual complaint — this was not resolved by the Step 2 fix, since Step 2 explicitly authorized only corner-selection hardening and speed-scaling (both already correct), not a change to the death-radius reference distance itself.

**Open question for you:** the ripple is now provably spec-correct (right corner, right timing formula) but still visually large/prominent because the subject's real distance to the left/right corners is ~10.6 units on a 12-unit floor. If you want it to read as "subtle" per the original bug report's expectation, that needs a deliberate spec change (e.g., capping the death radius independent of literal corner distance, or picking a different reference point) rather than a bugfix within Step 2's given scope — flagging rather than guessing, per this project's ask-don't-guess practice.

STOPPING per explicit instruction — dev servers stopped, no further work begun.

### 2026-08-02 — Domes: hemisphere → elevated full sphere

Request: the scanning source the domes represent is mounted at a height above ground, not ground-flush, so a ground-hugging hemisphere doesn't match — it should read as a full sphere. Since a full sphere centered at the old ground-level position would dip entirely below the floor by its own radius (and the floor is a sparse dot grid, not a solid occluder, so that would be visibly wrong), asked where the sphere center should sit; user chose a modest lift (~subject height, ~1.4 units) over a full-clearance lift (~outer radius, ~4.2 units), accepting that the two larger shells still dip somewhat below the floor.

Files touched:
- `DEMO_SPEC.md` — §5b Domes bullet rewritten: hemisphere → full sphere, center now one subject-height above the subject's base (not ground-flush), radii/opacity/breathing/no-y-rotation rules otherwise unchanged
- `frontend/src/domes.ts` — `SphereGeometry` calls dropped the four hemisphere-only args (`0, Math.PI*2, 0, Math.PI/2`), now full spheres by default; `group.position.y += subjectHeight` added after the existing `group.position.copy(position)` to lift the center

Decisions/observations:
- Only the dome group moved — the subject (intruder) capsule, ripple origin, sweep pivot, and floor tint falloff all stay at ground level as before. "Scanning source" was read as the (unseen) sensor the domes represent, distinct from the subject being detected — not a request to relocate the subject itself. Flagging this reading back in case it's wrong.
- Did not reframe the camera. With the lift, the outer sphere's apex rises from ~4.2 to ~5.6 units (was 33% taller than the old hemisphere's apex, which the camera's 85-90%-viewport-height framing was tuned against in Sprint 7) — checked this empirically via screenshot rather than assuming it'd be fine, and the sphere still fits comfortably inside the hero frame with room to spare, so left `cameraRig.ts` untouched.
- The accepted below-floor dip (outer shell's bottom reaches y≈-2.8, i.e. roughly a third of its own height below y=0) does not read as a broken "hard clip" artifact in practice, since the floor has no solid occluder — the wireframe simply overlaps the dot field rather than being cut by a visible plane. Confirmed via screenshot, not just reasoned about.

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- `grep -rn "thetaLength|hemisphere|Hemisphere" frontend/src/*.ts DEMO_SPEC.md` — no stray hemisphere geometry/code left, only the intentional prose references in `domes.ts`'s comment and `DEMO_SPEC.md` describing what changed
- Idle-state screenshot (frozen the instant `status === "idle"` was observed, same in-page rAF-freeze technique as the ripple bugfix above, to dodge this environment's ~10s screenshot latency): confirms 3 concentric full spheres, visibly round rather than flat-bottomed, elevated above the dot floor with a clear gap before the lower shells begin to overlap it, and the composition still fits inside the hero frame without overflowing top or sides.

Remaining manual steps: none for the code itself. Dev servers left running (started earlier this session at your request) — http://localhost:5173/ (frontend) and http://localhost:3001 (backend). Deploy to Render/Vercel remains outstanding, unchanged from every prior entry.

### 2026-08-02 — Radar sweep re-centered on the elevated domes

Follow-up to the hemisphere→sphere change above: the sweep still sat flat at ground level (its original, pre-elevation position), so it visually orbited the subject's feet rather than the domes it's meant to represent the scanning source's beam for. Request: move it to the sphere's center.

Files touched:
- `DEMO_SPEC.md` — §5b Radar sweep bullet: now explicitly sits at the domes' center height (one subject-height up), not ground level
- `frontend/src/main.ts` — added `scanningSourcePosition` (subject position with `y` raised by `subject.height`) and passed that to `createRadarSweep` instead of the ground-level `subjectPosition`; `radarSweep.ts` itself needed no change, since it already just lays its wedge flat at whatever position it's given

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- Idle-state screenshot (same rAF-freeze technique used throughout this session): the sweep wedge is now visibly slicing through the sphere cluster's mid-section rather than sitting down at the floor.

Remaining manual steps: none. Dev servers still running from earlier — http://localhost:5173/ / http://localhost:3001.

### 2026-08-02 — New: continuous scanning pulse (always-on, elevated)

Request: add a ripple system that runs irrespective of `DetectionEvent.status` (unlike the existing floor Ripple system, which only emits during detected/escalated), centered at the domes' center rather than the subject's base. Since a ring can't physically "lie on the floor" at that elevated height, asked how it should be oriented; user chose flat-horizontal in the same plane as the radar sweep (not camera-billboarded, not an expanding 3D sphere shell) — ties the two elevated elements together visually.

Files touched:
- `DEMO_SPEC.md` — new "Continuous scanning pulse" subsection under §5b's Ripple system (own emission/style/death-radius rules, explicitly independent of `DetectionEvent`); Micro-motion bullet updated to list it alongside the sweep/ripples as an allowed always-animating element
- `frontend/src/continuousRipples.ts` (new) — closely mirrors `ripples.ts`'s ring-regeneration-per-frame technique (fresh `RingGeometry` each frame so stroke width stays constant in world units), but: no `DetectionEvent`/status parameter at all (always emits), structure-colored (not threat-red, since it isn't state-tied), lower start opacity (0.35 vs the alert ripples' 0.6, deliberately subtler since it's ambient rather than an event), longer emit interval (2s vs 1.4s)
- `frontend/src/domes.ts` — `Domes` interface gained an `outerRadius` field (`subjectHeight * RADIUS_MULTIPLIERS[2]`) so `main.ts` doesn't have to duplicate the `3.0` multiplier as a magic number
- `frontend/src/main.ts` — creates `continuousRipples` centered at the same `scanningSourcePosition` used for the sweep, death radius = `domes.outerRadius` (so it dies exactly at the outer dome, never crossing it); `update()` called every frame unconditionally, no status argument

Decisions flagged (implementation details with no spec-given number before this session — same ask-don't-guess practice as every prior entry):
- Emit interval (2s) and life (2.75s, matching the floor ripples for a consistent pulse feel) — spec says "~2s" / "~2.5-3s," both tuned-not-blocking choices.
- Start opacity (0.35) chosen lower than the alert ripples' 0.6 specifically so this always-on element reads as ambient background motion rather than competing visually with a real detection event when both are on screen simultaneously (detected/escalated now shows both ripple systems at once — the floor one threat-red and ground-level, this one structure-blue and elevated).
- A small `PLANE_Y_OFFSET` (0.005) was added so this ring's plane doesn't z-fight with the radar sweep, which sits in the same nominal horizontal plane at the same origin.

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- Static screenshots weren't conclusive on their own (a thin, additively-blended, 0.35-opacity structure-colored ring is hard to pick out by eye against an already-bright bloomed sphere in a single still) — rather than accept an inconclusive visual check, added a temporary `window.__continuousRippleCount` hook (removed after) and sampled it every ~2.5s over a 9s run alongside the live HUD status: confirmed `pulseCount=2` while `status=idle` at t≈3s, proving pulses spawn and persist during idle — the specific behavior the whole feature exists for — and not just during detected/escalated like the pre-existing floor ripples.

Remaining manual steps: none. Dev servers still running — http://localhost:5173/ / http://localhost:3001.

### 2026-08-02 — Continuous pulse: full scene scale instead of dome-capped

Follow-up to the continuous scanning pulse above: it was dying at the domes' own outer radius (~4.2 units), reading as too small/contained. Asked what "full scale" should mean; user chose matching the existing floor Ripple system's reach (~10.6 units, the subject-to-floor-left-corner distance) so both ripple systems max out at a visually consistent size.

Files touched:
- `DEMO_SPEC.md` — Continuous scanning pulse subsection: death radius now explicitly the same one the floor Ripple system uses, not the domes' outer radius
- `frontend/src/main.ts` — reordered so the corner-projection/`rippleDeathRadius` block (previously computed after the domes/sweep but before the floor `ripples`) now also feeds `continuousRipples`, which moved to after it; `domes.outerRadius` is no longer referenced here
- `frontend/src/domes.ts` — removed the now-unused `outerRadius` field from the `Domes` interface and its computation (was added solely for this pulse's old cap; per this project's no-dead-code practice, removed rather than left dangling)
- `frontend/src/continuousRipples.ts` — comment updated to describe the death radius as caller-supplied/shared with the floor ripples, not a domes-derived value

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- `grep -rn "outerRadius" frontend/src` — no matches, confirms full removal
- Idle-state screenshot (~2s in, same rAF-freeze technique): the pulse ring is now clearly visible extending well past the outer dome's silhouette, comparable in scale to the domes themselves rather than contained inside them.

Remaining manual steps: none. Dev servers still running — http://localhost:5173/ / http://localhost:3001.

### 2026-08-02 — Continuous pulse: flat rings → 3D wireframe spheres, neon blue

Request: change the continuous pulse's shape from flat circles to spheres, colored blue. Since the existing structure blue-gray (#7A8FA6) is already technically "blue," asked what shade was meant; user said "neon blue" — a distinct saturated blue, not the muted structure tone. Picked `#00D4FF` (bright cyan-blue) as a concrete value, since bloom favors bright/saturated colors and this reads clearly as its own color against the domes.

Files touched:
- `frontend/src/palette.ts` — added `CONTINUOUS_PULSE_HEX = 0x00d4ff`, flagged as not yet part of the formal two-tone STRUCTURE/THREAT palette family; no CSS-string counterpart added since (checked first) none of the existing `*_CSS` exports are actually consumed anywhere in the codebase, so adding one here would just be more of the same pre-existing dead pattern rather than something this change needed
- `frontend/src/continuousRipples.ts` — rewritten: each pulse is now a `THREE.LineSegments` wireframe sphere (`WireframeGeometry` over a `SphereGeometry`) instead of a flat `RingGeometry`. Adopted the domes' own technique — one shared unit-sphere geometry, grown via `mesh.scale.setScalar(radius)` — rather than regenerating geometry every frame like the old ring version needed (that per-frame regen existed only to keep the ring's stroke *width* constant in world units, a concern that doesn't apply to a wireframe sphere's line thickness); this is strictly cheaper, and geometry is never disposed per-pulse since it's shared. Dropped the flat-plane rotation and the z-fight-avoidance Y offset (both were specific to lying flat in the sweep's plane, moot for a 3D sphere). Color switched from `STRUCTURE_ACCENT_HEX` to the new `CONTINUOUS_PULSE_HEX`.
- `DEMO_SPEC.md` — Continuous scanning pulse subsection: describes the 3D wireframe-sphere-via-shared-geometry-and-scale technique explicitly (mirroring the domes'), and the new neon-blue color with a pointer to where it's defined and a note that it's a standalone palette addition, not folded into §5's formal two-tone scheme

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- `grep -rn "STROKE_WIDTH|ringGeometryAt|RingGeometry" frontend/src/continuousRipples.ts` — no matches, confirms the old ring implementation is fully gone, not left dangling alongside the new one
- Idle-state screenshot (~1.2s in, same rAF-freeze technique): confirms a genuine 3D wireframe sphere shell (not a flat disc — visibly curves in perspective the same way the domes do) in a clearly distinct cyan/neon blue, expanding around and past the dome cluster.

Remaining manual steps: none. Dev servers still running — http://localhost:5173/ / http://localhost:3001.

### 2026-08-02 — Domes deleted entirely

Request: delete "the initial breathing spheres" — the 3 concentric wireframe domes with the breathing scale oscillation (present in every sprint from 5 through 9 in one form or another: full spheres → hemispheres → elevated full spheres). Now that the continuous scanning pulse exists as a distinct, more prominent elevated element, the domes were removed rather than modified.

Files touched:
- `frontend/src/domes.ts` — deleted entirely
- `frontend/src/main.ts` — removed the `createDomes` import, the `domes` instance, `worldGroup.add(domes.group)`, and `domes.update(delta)` from the render loop; `scanningSourcePosition`'s computation (subject position + one subject-height) was never derived from the domes object itself (just from `subject.height`), so the sweep and continuous pulse are both unaffected positionally — they still sit at the same elevated point, there's just no visible sphere mesh there anymore
- `frontend/src/continuousRipples.ts`, `frontend/src/palette.ts`, `frontend/src/subject.ts` — comments that referenced "the domes" (as a technique reference, a palette-family member, or a brightness-comparison target) reworded to stand on their own now that the module they referenced no longer exists
- `DEMO_SPEC.md` — Domes bullet under §5b's Subject lifecycle section replaced with a brief deletion note (matching this doc's existing precedent for the echo-blip and old pulse-rings deletions — a short marker, not a large historical block); every other bullet that listed "domes" among the things that re-center on the subject/yaw change (Floor orientation, Subject, Camera, Micro-motion) had that reference dropped; Radar sweep and Continuous scanning pulse bullets reworded to describe their elevated-height positioning as its own concept, independent of the now-nonexistent domes; also removed §5's already-doubly-stale "Wireframe spheres" bullet (a pre-Sprint-5 leftover describing an even earlier version of this same feature, itself already superseded once before the domes existed)
- `DEMO_SPEC.md` §5b Camera bullet — the "outer dome spans ~85-90% of viewport height" framing target no longer has a referent; reworded to describe the composition fitting comfortably in general terms, with an explicit note that camera distance is no longer governed by any specific on-screen size target and just stays at its last-tuned value (not re-solved or re-tuned as part of this change — out of scope for a deletion request, flagged rather than silently left ambiguous)

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- `grep -rni "dome" DEMO_SPEC.md` — only the intentional deletion-note references remain; `grep -rni "dome" frontend/src` — only an unrelated `renderer.domElement` match
- Idle-state screenshot (same rAF-freeze technique): confirms the gray-blue breathing domes are gone; the radar sweep and the (now much more visually prominent, no longer competing with the domes) neon-blue continuous pulse are both still present and correctly centered at the elevated scanning-source height; HUD/event-log/disclosure elements unaffected.

Remaining manual steps: none for the code itself. Camera framing was flagged, not re-tuned, since the domes' removal changes what "fits comfortably" means but wasn't asked to be re-solved — worth a live look if the composition now reads as under-framed with the domes gone. Dev servers still running — http://localhost:5173/ / http://localhost:3001.

### 2026-08-02 — Continuous pulse: slower expansion

Request: reduce the speed of the continuous pulse spheres. `LIFE_S` (the constant `speed = deathRadius / LIFE_S` is derived from) raised from 2.75s to 6.0s — roughly 2.2x slower — chosen as a clearly-noticeable-but-not-extreme value since no specific target was given; flagged rather than guessed at a "correct" number. Emission cadence (`EMIT_INTERVAL_S = 2.0`, unchanged) wasn't touched, so more pulses now overlap on screen at once (life/interval ratio went from ~1.4 to ~3) as a side effect of the slower expansion — not asked for, but noted in case it reads as too busy.

Files touched:
- `frontend/src/continuousRipples.ts` — `LIFE_S` 2.75 → 6.0
- `DEMO_SPEC.md` — Continuous scanning pulse subsection's Speed bullet updated to the new ~6s target, noting the change from the original ~2.75s

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- Rather than eyeball speed from a screenshot (unreliable for a rate, not a static state), added a temporary `window.__firstPulseRadius` hook (removed after) and sampled a live pulse's radius at 3 timestamps ~1.7s apart: measured growth rates of 1.69 and 1.77 units/s, matching the expected `deathRadius / 6.0 ≈ 1.77 units/s` (deathRadius ≈10.607, established earlier this session) — versus the old ~3.86 units/s, confirming a ~2.2x slowdown as intended.

Remaining manual steps: none. Dev servers still running — http://localhost:5173/ / http://localhost:3001.

### 2026-08-02 — Continuous pulse: rebuilt as a 5-site concentric cascade

Request: replace the single-origin-expanding-sphere mechanic with 5 fixed concentric "sites" (all sharing the scanning-source origin, at 5 different radii), each independently spawning its own sphere that grows for a few seconds and disappears. Asked whether the 5 sites should pulse in sync or independently-staggered, since that was the one open design question; user gave a more specific answer than either option: spawn strictly sequentially outermost-first through innermost, all 5 sharing the *same* grow+fade duration — only the spawn *time* is staggered, not the cycle length.

Files touched:
- `frontend/src/continuousRipples.ts` — rewritten from the single-origin/grow-from-zero-to-full-scale model to a 5-site model: `SITE_FRACTIONS = [1.0, 0.8, 0.6, 0.4, 0.2]` of `deathRadius` (outer→inner, evenly spaced); each site has its own `nextSpawnAt` timer seeded at `siteIndex * STAGGER_S` (`STAGGER_S = 1.0s`) and re-armed `+= PERIOD_S` (`= SITE_COUNT * STAGGER_S = 5s`) after each spawn, so the whole 5-site sequence repeats every 5s; each spawned pulse grows from its site's own radius to `site radius + 18% of deathRadius` over a shared `LIFE_S = 3.0s`, fading opacity to 0 over the same span (reused the existing grow-while-fading formula, just retargeted per-pulse instead of shared-global)
- `DEMO_SPEC.md` — Continuous scanning pulse subsection rewritten to describe the 5-site cascade (site radii, bounded per-site growth instead of grow-to-full-scale, sequential outer→inner spawn timing, shared cycle duration)

Decisions flagged (implementation choices where "a few seconds" / "5 concentric sites" didn't pin down an exact number):
- Site spacing (evenly spaced 20%-100% of deathRadius) and per-site growth bound (18% of deathRadius, deliberately less than the 20%-of-deathRadius gap between adjacent sites so pulses read as distinct rather than immediately merging into each other) — both tuned, not spec'd.
- Stagger (1s between site spawns) and per-pulse life (3s) — chosen so the full 5-site cascade takes 5s to fully unfold (matches "a few seconds" per pulse) before repeating.

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- A static screenshot wasn't conclusive alone (5 overlapping, growing, additively-blended spheres read as one dense bright blob at a glance, especially against subject bloom during an alert state) — verified precisely instead with a temporary `window.__pulseRadii` hook (removed after), sampling all live pulses' radii at 4 timestamps ~1.2-1.4s apart: adjacent pulses' radii consistently differed by ~2.7-2.8 units at every sample, matching the predicted combination of site spacing (2.12 units = 20% of deathRadius≈10.607) plus one stagger-interval's worth of growth (≈0.64 units) almost exactly (2.12+0.64=2.76) — confirms the concentric spacing and staggered-growth mechanic are both working as designed, not just visually plausible.
- Noted (not a defect, matches a previously-documented quirk of this headless environment): the very first animate() frame after page load can have an inflated delta from page/module-load time, occasionally causing 2-3 sites to cross their spawn threshold in that single first frame instead of spreading out in real time — a one-time startup artifact, not a recurring issue once the cascade is running.

Remaining manual steps: none. Dev servers still running — http://localhost:5173/ / http://localhost:3001.

### 2026-08-02 — Continuous pulse: smaller site radii

Request: reduce the spawning radius of all 5 concentric sites. Halved the whole set — `SITE_FRACTIONS` `[1.0, 0.8, 0.6, 0.4, 0.2]` → `[0.5, 0.4, 0.3, 0.2, 0.1]` of `deathRadius` — rather than picking a single new number, since "all concentric circles" reads as a uniform scale-down of the whole spread, not a change to any one site. `GROWTH_FRACTION` (0.18 → 0.09) was halved along with it, keeping the growth-to-site-spacing ratio identical (growth stays ~90% of the gap between adjacent sites) so the pulses still read as distinct rather than immediately overlapping now that they're packed into a smaller area.

Files touched:
- `frontend/src/continuousRipples.ts` — `SITE_FRACTIONS` and `GROWTH_FRACTION` halved, comments updated
- `DEMO_SPEC.md` — Continuous scanning pulse subsection's site-radii and growth bullets updated to the new 10%-50% spread (from 20%-100%)

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- Idle-state screenshot (same rAF-freeze technique): confirms the whole cascade now sits visibly closer to the scanning source's center — clearly nested concentric spheres at a noticeably smaller scale — rather than reaching out toward the floor's edge as before.

Remaining manual steps: none. Dev servers still running — http://localhost:5173/ / http://localhost:3001.

### 2026-08-03 — Continuous pulse: spheres rotate while growing

Request: rotate the pulse spheres while they're growing. Since every pulse's growth and fade happen simultaneously across its whole lifetime (there's no separate "grow phase" distinct from "alive"), this reads as "rotate for as long as the pulse exists." Added `ROTATION_RAD_S = (2π) / LIFE_S` — one full rotation per pulse lifetime, so the spin rate is derived from (and stays in sync with) the grow/fade duration rather than being an arbitrary unrelated rate — and `mesh.rotation.y += ROTATION_RAD_S * deltaSeconds` in the per-pulse update loop.

Files touched:
- `frontend/src/continuousRipples.ts` — added `ROTATION_RAD_S` and the per-frame rotation increment; header comment updated
- `DEMO_SPEC.md` — Continuous scanning pulse subsection: new bullet describing the one-rotation-per-lifetime spin

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- A static screenshot can't show rotation, and an initial attempt at measuring it via `children[0].rotation.y` sampled over time gave inconsistent/decreasing readings — traced to `children[0]` not being a stable reference (the array reorders as pulses spawn/die, so index 0 can silently point to a *different* pulse between samples, not the same one continuing to rotate). Redid it correctly: tagged pulses by their Three.js object `uuid` (stable identity) and sampled all live pulses' rotations at 3 timestamps, matching by id across samples. Every matched pulse showed the *same* rate as every other pulse within each interval (1.697 rad/s for both live pulses across the first interval, 1.824 rad/s for all three live pulses across the second) — proving the rotation is applied uniformly and correctly, not per-pulse noise. The measured rate runs ~13-19% under the target 2.094 rad/s, consistent with wall-clock-vs-simulated-time measurement overhead already documented elsewhere in this session for this headless environment, not a logic error (a real per-pulse bug would show *different* pulses drifting at *different* rates, which did not happen).

Remaining manual steps: none. Dev servers still running — http://localhost:5173/ / http://localhost:3001.

### 2026-08-03 — Continuous pulse: slower rotation

Request: reduce the pulse spheres' rotation speed, "rotate slowly." Decoupled the spin rate from `LIFE_S` (which made every pulse complete a full showy spin within its 3s lifetime) and introduced a standalone `ROTATION_PERIOD_S = 10.0` — a full rotation now takes ~10s, longer than a pulse's own ~3s life, so each pulse only turns a modest fraction of a full rotation before it fades: reads as a gentle drift rather than a spin. No specific target speed was given beyond "slowly," so this is a tuned/flagged choice like the earlier speed reductions this session.

Files touched:
- `frontend/src/continuousRipples.ts` — `ROTATION_RAD_S` no longer derived from `LIFE_S`; now `(2π) / ROTATION_PERIOD_S` with `ROTATION_PERIOD_S = 10.0`
- `DEMO_SPEC.md` — Continuous scanning pulse subsection's rotation bullet updated: "~10s per rotation, longer than a pulse's own lifetime" instead of "one rotation per lifetime"

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- Reused the ID-matched rotation-sampling technique from the previous entry (tag pulses by Three.js `uuid`, sample multiple live pulses at 3 timestamps, match by id): measured rates of 0.486 and 0.772 rad/s across two intervals — again identical across every live pulse within each interval (proving uniform application, not per-pulse drift) — bracketing the new target of `2π/10 ≈ 0.628 rad/s` and clearly well below the previous ~1.7-1.82 rad/s, confirming a substantial, correctly-applied slowdown.

Remaining manual steps: none. Dev servers still running — http://localhost:5173/ / http://localhost:3001.

### 2026-08-03 — Continuous pulse: rotation slowed further

Request: reduce the rotation speed even more. `ROTATION_PERIOD_S` 10.0 → 30.0 (a 3x reduction on top of the previous 3x reduction, so ~10x slower than the original one-rotation-per-lifetime rate). At this rate a single ~3s pulse only turns about 36° before it fades — the rotation is now closer to a subtle drift than a visible spin.

Files touched:
- `frontend/src/continuousRipples.ts` — `ROTATION_PERIOD_S` 10.0 → 30.0
- `DEMO_SPEC.md` — Continuous scanning pulse subsection's rotation bullet updated to ~30s per rotation, "a sliver of a rotation" per pulse lifetime

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- Same ID-matched rotation-sampling technique, with longer (~0.9-1s) intervals for better signal at this slower rate: measured 0.169 and 0.236 rad/s across two intervals, bracketing the new target `2π/30 ≈ 0.209 rad/s`, again identical across every live pulse within each interval — confirms the further slowdown is real and uniformly applied.

Remaining manual steps: none. Dev servers still running — http://localhost:5173/ / http://localhost:3001.

### 2026-08-03 — Continuous pulse: wider spacing between sites

Request: increase the distance between the 5 concentric spheres. Scaled `SITE_FRACTIONS` up uniformly — spacing 0.1 → 0.15 of `deathRadius` per site, i.e. `[0.5, 0.4, 0.3, 0.2, 0.1]` → `[0.75, 0.6, 0.45, 0.3, 0.15]` — rather than only pushing the outermost site further out, so every gap widens evenly (consistent with how the earlier "reduce spawning radius" request scaled the whole set down uniformly). `GROWTH_FRACTION` scaled proportionally too (0.09 → 0.135), keeping it at 90% of the site spacing so pulses stay visually distinct rather than immediately overlapping now that the sites themselves are further apart.

Files touched:
- `frontend/src/continuousRipples.ts` — `SITE_FRACTIONS` and `GROWTH_FRACTION` widened, comments updated
- `DEMO_SPEC.md` — Continuous scanning pulse subsection's site-spacing and growth bullets updated to the new 15%-75% spread (from 10%-50%)

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- Reused the earlier `window.__pulseRadii` radius-sampling technique (added temporarily, removed after): measured adjacent-pulse radius differences of ~2.03-2.10 units at 3 timestamps, matching the predicted new spacing (site gap 1.591 + one stagger-interval's growth 0.477 ≈ 2.068) — versus the ~1.38 units this same math implies for the pre-change spacing, confirming the widening took effect correctly.

Remaining manual steps: none. Dev servers still running — http://localhost:5173/ / http://localhost:3001.

### 2026-08-03 — Continuous pulse: origin lowered a bit

Request: lower the center of the concentric circles a bit. Read as the continuous pulse's origin specifically, not the radar sweep — the sweep is the only other element sharing `scanningSourcePosition`, and the request named "the concentric circles," not the sweep. Gave the pulse system its own origin (`pulseOriginPosition`), computed as the sweep's scanning-source height minus 30% of the subject's height, rather than continuing to share `scanningSourcePosition` directly with the sweep. 30% was a judgment call for "a bit" — no exact amount was given.

Files touched:
- `frontend/src/main.ts` — added `PULSE_ORIGIN_LOWER_FRACTION = 0.3` and `pulseOriginPosition`, passed to `createContinuousRipples` instead of `scanningSourcePosition`; the sweep's own call site is untouched
- `DEMO_SPEC.md` — Continuous scanning pulse subsection's origin bullet updated: the 5 sites now share a point below the sweep's height (one subject-height minus 30% of subject height), explicitly noted as the pulse's own origin, not shared with the sweep

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- Added a temporary one-line console log of both the sweep's Y and the pulse's new Y (removed after), captured via a Playwright console listener on page load: confirmed `sweep Y=1.4000` (unchanged) and `pulse Y=0.9800` (= 1.4 − 0.3×1.4, exactly matching the formula) — the sweep is provably untouched and the pulse origin is provably lowered by the intended amount, not just visually plausible.

Remaining manual steps: none. Dev servers still running — http://localhost:5173/ / http://localhost:3001.

### 2026-08-03 — Floor: rectangular instead of square; dropped the left/right-corner-level acceptance condition

Request: lengthen the floor edge running from the back corner to the right corner, and drop the Floor orientation acceptance condition requiring the LEFT/RIGHT corners to share a horizontal screen line.

Files touched:
- `frontend/src/groundPlane.ts` — `GROUND_SIZE` (a single square dimension) split into `GROUND_SIZE_X = 18` and `GROUND_SIZE_Z = 12`. Per the established corner naming from the Sprint 9 bugfix diagnosis (BACK=local(-half,-half), RIGHT=local(+half,-half)), the BACK-to-RIGHT edge runs along constant z=-halfZ with x varying — i.e. its length is the X dimension — so lengthening `GROUND_SIZE_X` specifically lengthens that edge (and its parallel, FRONT-to-LEFT), leaving the other pair (BACK-to-LEFT, FRONT-to-RIGHT) at the original 12. No exact target length was given — 18 (50% longer) was a tuned, flagged choice. The floor mesh (`PlaneGeometry(GROUND_SIZE_X, GROUND_SIZE_Z)`) and the dot grid were both updated; the dot grid was reworked from a fixed 64x64 index count (which would have stretched dot spacing unevenly across the now-unequal dimensions) to a uniform-spacing scheme: density is set by a 64-dot baseline along the shorter Z edge, then the X-direction dot count is derived from that same spacing so dots stay evenly spaced in both directions rather than looking stretched.
- `frontend/src/main.ts` — `GROUND_SIZE` import replaced with `GROUND_SIZE_X`/`GROUND_SIZE_Z`; `subjectPosition`'s x and z components now use their respective half-extents instead of one shared `half`; the floor-corner-projection block (used for the ripple systems' death radius) likewise now uses separate `halfX`/`halfZ` — the corner-picking-by-camera-projection logic itself needed no change, since it was already written generically per corner rather than assuming a square
- `DEMO_SPEC.md` — Ground plane bullet: documents the rectangle's dimensions and the uniform-dot-spacing approach; Floor orientation bullet: condition (a) (left/right corners level) removed entirely, with an explicit note that it's dropped per request and isn't expected to hold now that the floor isn't square; only the back/front center-offset condition remains, and the Acceptance line updated to match

Explicitly not done (flagged, not attempted): `FLOOR_ROTATION_DEG` (46.7°) and the camera's distance/look-at were both originally solved (in the Sprint 9 bugfix) specifically against the old square's corner geometry — with the floor now a different shape and one of the two acceptance conditions gone, that old fixed-point solve no longer applies, but neither was asked to be redone. Left both untouched at their existing values rather than guessing at a new "correct" fit for the rectangle.

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- `grep -rn "GROUND_SIZE\b" frontend/src` — no matches, confirms the old single-dimension export is fully gone, not left dangling alongside the new pair
- Idle-state screenshot (same rAF-freeze technique) plus a zoomed crop of the floor region: confirms the dot grid now reads as visibly wider than deep — an actual rectangle, not a stretched-looking square — and the overall composition still holds together in frame without anything obviously overflowing or broken, though this wasn't re-solved against the removed acceptance criteria and is worth a live look if the framing feels off now that the floor's proportions changed.

Remaining manual steps: none for the code itself. Dev servers still running — http://localhost:5173/ / http://localhost:3001.

### 2026-08-03 — Camera zoomed out so the whole rectangular floor fits

Request: zoom out so the rectangular floor fits in the screen area. Solved empirically rather than eyeballing a bigger number — added a temporary `window.__ndcAtDistance(lx, lz, distance)` hook (removed after) that repositions the real camera to a candidate distance, projects a floor corner, then restores the camera; swept `distance` from 12 to 34 in a Node/Playwright script and read off the max |NDC| across all 4 corners at each step.

This surfaced a real, pre-existing problem the last entry's screenshot check didn't catch: at the old `DISTANCE = 12.2`, the floor's FRONT corner (nearest the camera) projects at NDC y ≈ **-4.47** — wildly off-screen, not just "a bit clipped." This wasn't introduced by the rectangle change; the Sprint 9 bugfix's own diagnostic log already found this corner at ndc.y=-2.283 for the old square floor, it was just never treated as a problem because the Floor orientation acceptance test only checked relationships *between* corners (left/right level, back/front offset), never "is this corner actually on screen." The wider rectangle floor made it impossible to keep not-noticing.

Files touched:
- `frontend/src/cameraRig.ts` — `DISTANCE` 12.2 → 26, picked as the smallest swept value giving every corner a comfortable margin inside NDC [-1, 1] (max |NDC| ≈ 0.82 at 26, on the front corner — the binding constraint throughout the sweep by a wide margin over the other three corners). `ELEVATION_DEG` and `LOOK_AT` untouched — a pure distance zoom, no reframing of angle or center.
- `frontend/src/main.ts` — temporary `__ndcAtDistance` hook added then fully removed
- `DEMO_SPEC.md` — Camera bullet: replaced the stale "no specific on-screen size target governs distance" note (left over from the domes-deletion entry) with the new concrete target (all 4 corners on-screen with margin) and a pointer to `cameraRig.ts`'s derivation

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- Idle-state screenshot: the floor's full diamond silhouette (all 4 corners, including the previously off-screen front one) is now clearly visible with comfortable margin on every side, and the sphere cluster/subject composition above it still reads cleanly at this more distant framing.

Remaining manual steps: none. Dev servers still running — http://localhost:5173/ / http://localhost:3001.

### 2026-08-03 — Floor: black + less dense; pulse spheres fainter where they overlap the floor

Two-part request: (1) the pulse spheres should read fainter specifically where they visually overlap the floor plane, from the observer's viewpoint; (2) the floor should be pure black with a less dense dot grid.

For (1), asked whether "faint where the floor is visible" meant a simple overall opacity reduction or something spatially targeted; user clarified it's specifically the latter — faintness only where the sphere overlaps the floor, keeping the rest as-is. A true per-pixel/depth-based occlusion test would need a custom shader (screen-space or render-target comparison) — out of proportion for a cosmetic tweak in a codebase that otherwise uses only stock Three.js materials plus one pre-built shader (Vignette). Went with a practical stand-in: since the camera is fixed and always looks down at the Y=0 floor, the lower half of each sphere is what visually sits over the floor from this specific viewpoint — so each sphere is split at its equator into two separate meshes (sharing scale/rotation/color) with the lower one rendered at a reduced opacity.

Files touched:
- `frontend/src/continuousRipples.ts` — added `splitByHemisphere()`, which buckets a `WireframeGeometry`'s line segments (by midpoint y, keeping each 2-vertex segment intact) into upper/lower `BufferGeometry`s, computed once from the shared unit sphere. `Pulse` now tracks `upperMesh`/`upperMaterial` and `lowerMesh`/`lowerMaterial` instead of a single mesh; both are grown/rotated identically each frame, but `lowerMaterial.opacity` is `LOWER_HEMISPHERE_OPACITY_FACTOR = 0.4` times the upper's at every point in the fade curve
- `frontend/src/groundPlane.ts` — `FLOOR_COLOR` 0x0c0f15 → 0x000000 (pure black); `GRID_COUNT_Z` (the baseline dot-density constant) 64 → 32, roughly doubling dot spacing in both directions (the existing uniform-spacing derivation for `GRID_COUNT_X` picks this up automatically, no other change needed)
- `DEMO_SPEC.md` — Ground plane bullet: floor color and halved dot density documented; Continuous scanning pulse subsection: new bullet describing the hemisphere split and its opacity factor, explicitly flagged as an approximation rather than true observer-relative occlusion

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- Idle/detected-state screenshot: floor reads as black (not the previous dark blue-gray) with a visibly sparser dot grid; the pulse sphere's upper portion reads noticeably brighter/denser than its lower portion near the floor
- Added a temporary `window.__pulseOpacities` hook (removed after), reading every live mesh's `material.opacity` directly: got two upper/lower pairs, with lower/upper ratios of exactly 0.400 and 0.400 — confirms the opacity factor is applied precisely as intended, not just plausible-looking in a screenshot

Remaining manual steps: none. Dev servers still running — http://localhost:5173/ / http://localhost:3001.

### 2026-08-03 — Outer pulse sphere holds until the cascade completes; camera zoomed back in a bit

Two-part request: (1) the outermost pulse sphere should keep growing (not fading) until the innermost sphere has spawned, only then start fading — timing adjusted accordingly; (2) zoom the camera in a bit from the last entry's full-fit distance, explicitly accepting that a small sliver of the front corner may fall outside the frame.

For (1): previously every site (including the outer one) grew-while-fading independently over the same fixed `LIFE_S` (3s), so the outer sphere was already fully faded and gone by t=3s — well before the innermost site even spawns (~t=4s into that pulse's own cycle). Gave the outer site (index 0) a distinct two-phase lifecycle instead of the shared one:

Files touched:
- `frontend/src/continuousRipples.ts` — added `siteIndex` to the `Pulse` interface (needed so `update()` can special-case the outer site); added `OUTER_GROW_DURATION_S = (SITE_COUNT - 1) * STAGGER_S` (= 4.0s, exactly the time from the outer site's own spawn to the innermost site's spawn) and `OUTER_FADE_DURATION_S = LIFE_S` (reused the existing 3s constant as a fade-only duration, since no specific fade length was given — "adjust the timing accordingly"); `update()`'s per-pulse loop now branches: `siteIndex === 0` grows radius (opacity held at full) for `OUTER_GROW_DURATION_S`, then freezes radius at `endRadius` and fades over `OUTER_FADE_DURATION_S`; every other site keeps the original grow-while-fade-over-`LIFE_S` behavior, untouched
- `DEMO_SPEC.md` — Continuous scanning pulse subsection's spawn-timing bullet rewritten to describe the outer site's distinct two-phase lifecycle separately from sites 1-4's unchanged shared cycle

For (2): reused the exact swept-distance table from the prior "zoom out" entry (no need to re-sweep) and picked `DISTANCE = 22` — front corner max |NDC| ≈ 1.06 (a small, ~6% overshoot past the screen edge, as explicitly authorized) while every other corner stays comfortably inside (next-worst ≈ 0.61).

Files touched:
- `frontend/src/cameraRig.ts` — `DISTANCE` 26 → 22, doc comment extended with this second pass's derivation
- `DEMO_SPEC.md` — Camera bullet: now describes both the original "all corners fit" solve and this relaxation (front corner may partially clip, by design)

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- Outer-site timing: added a temporary `window.__pulseDebug` hook (removed after), sampling every live pulse's `siteIndex`/`age`/`radius`/`opacity` across ~9s. Caught a site-0 pulse at age=4.815s (past the 4.0s grow cutoff) with radius frozen at ≈9.50 (its `endRadius`) and opacity=0.2549 — matching the hand-computed prediction (`0.35 × (1 − (4.815−4)/3) = 0.2548`) almost exactly, confirming the two-phase logic fires at the right time with the right values, not just "looks about right." Also incidentally confirmed two overlapping site-0 pulses can coexist (one still fading from the previous cascade, a new one already growing from the next) — an expected consequence of the outer site's total life (7s) now exceeding the cascade's repeat period (5s), not a bug.
- Camera: escalated-state screenshot confirms a visibly tighter frame — the sphere cluster now fills noticeably more of the canvas — consistent with the ~15% distance reduction; the numeric NDC sweep already established the front-corner overshoot is small, not a large clip.

Remaining manual steps: none. Dev servers still running — http://localhost:5173/ / http://localhost:3001.

### 2026-08-03 — Pulse spheres: faster continuous growth (never freezes) + slower rotation

Three-part request: (1) increase the pulse spheres' growth rate a bit; (2) let them keep growing all the way until they've fully faded away, rather than the outer sphere freezing its radius during its fade phase (introduced two entries ago); (3) further reduce rotation speed.

This meant replacing the fixed-`endRadius`-then-freeze model with a genuinely continuous one: every pulse now grows at a constant rate for its *entire* life, with no separate "stop growing" point — opacity fading is a fully independent schedule layered on top, not tied to a radius target anymore.

Files touched:
- `frontend/src/continuousRipples.ts` — rewritten: `GROWTH_FRACTION` (a fixed total-growth-amount constant) replaced with `GROWTH_RATE_FRACTION_PER_S = 0.055` (a per-second rate, ~22% faster than the previous fixed model's implied rate of `0.135/3.0 ≈ 0.045/s`); `Pulse` no longer stores `endRadius` — every frame, `radius = startRadius + growthRate * age` for as long as the pulse is alive, full stop. For site 0 (outer), the old "freeze radius once the hold period ends" branch was removed — it still becomes eligible to fade at the same point (`OUTER_HOLD_DURATION_S = 4.0s`, renamed from `OUTER_GROW_DURATION_S` since growth is no longer distinct from what happens after), but radius keeps climbing at the same rate straight through the fade too, right up until removal at `OUTER_HOLD_DURATION_S + OUTER_FADE_DURATION_S ≈ 7s`. `ROTATION_PERIOD_S` 30.0 → 45.0.
- `DEMO_SPEC.md` — Continuous scanning pulse subsection updated: growth described as a continuous rate rather than a bounded amount; outer site's bullet explains it grows for its whole ~7s life (not just the first 4s) and so ends up considerably larger than the other sites by design; rotation bullet's target updated to ~45s per rotation

Decisions flagged (no exact numbers given beyond "a bit" / "reduce"):
- Growth rate bump (~22%, chosen to read as "a bit" faster without being dramatic) and rotation period (45s, a further ~50% slowdown from 30s) were both tuned choices.
- Because growth no longer stops at a fixed `endRadius`, sites 1-4 now grow slightly past where they used to stop before fading away (their fixed 3s life × the new faster rate is a larger total distance than the old fixed growth amount was) — a direct, expected consequence of switching from "grow to a target" to "grow continuously," not a separate change.

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- One combined temporary `window.__pulseDebug2` hook (removed after) captured radius/rotation/opacity for every live pulse (matched by Three.js `uuid` across samples, the same technique validated in earlier entries) across ~7s. This single capture rigorously confirmed all three changes at once: (a) growth rate measured at 0.557-0.626 units/s, consistent with the new ~0.583 units/s target (up from the previous ~0.477 units/s); (b) one specific pulse's opacity dropped from 0.350 → 0.294 (actively fading) between two samples while its radius *simultaneously* rose from 10.046 → 10.699 in that same window — direct proof growth does not freeze once fading begins, the core behavioral change requested; (c) rotation rate computed at ≈0.132 rad/s, close to the new `2π/45 ≈ 0.1396 rad/s` target and clearly below the previous ~0.17-0.24 rad/s range.
- Idle/detected-state screenshot 6s in: the sphere cluster reads visibly larger/denser than in prior screenshots, consistent with faster, unbounded growth.

Remaining manual steps: none. Dev servers still running — http://localhost:5173/ / http://localhost:3001.

### 2026-08-03 — Floor: back-left edge lengthened 20%

Request: increase the length of the edge at the left of the back corner by 20%. That's the BACK-to-LEFT edge (and its parallel FRONT-to-RIGHT edge) — `GROUND_SIZE_Z`, the dimension left untouched by the earlier back-to-right lengthening. 12 → 14.4 units (exactly 20%, an exact figure this time, not a tuned guess).

Files touched:
- `frontend/src/groundPlane.ts` — `GROUND_SIZE_Z` 12 → 14.4; the dot-grid spacing/count derivation (`DOT_SPACING`/`GRID_COUNT_X`) already reads `GROUND_SIZE_Z` reactively, so it needed no separate change
- `DEMO_SPEC.md` — Ground plane bullet updated with the new 14.4-unit figure and its derivation

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- Added a temporary per-corner NDC console log (removed after) reusing the existing floor-corner-projection code already in `main.ts` (no new logic needed): the FRONT corner's overshoot grew from NDC y ≈ -1.06 to ≈ -1.21 (the front corner is already accepted as partially clipped per two entries ago) — a modest increase, not a large one — while the other three corners stayed comfortably on-screen (back ≈0.36, left ≈-0.63, right ≈0.63, all well within [-1, 1]). Flagged rather than re-tuning the camera again, since this request didn't ask for that and the overshoot is still small.
- Idle-state screenshot: floor's diamond silhouette reads visibly wider/deeper along the back-left edge.

Remaining manual steps: none. Dev servers still running — http://localhost:5173/ / http://localhost:3001.

### 2026-08-03 — Continuous pulse: outer sphere retimed to fully fade before the second-innermost spawns

Request: the outermost sphere must be fully faded away by the time the second-innermost site (index 3) spawns, and the timing of the other spheres adjusted accordingly. Asked whether "adjust the timing of other spheres accordingly" meant only compressing the outer sphere's own hold/fade split, or re-timing the whole cascade; user chose the latter, without specifying an exact target relationship, so this required an actual design, not just a number swap.

The previous design (from two entries ago) held the outer sphere at full opacity until the INNERMOST site (index 4) spawned, then faded — but index 4 spawns *after* index 3, so under that design the outer sphere's fade couldn't even *start* until after the new deadline had already passed. Not fixable by shortening the fade alone; the hold trigger itself had to change.

Files touched:
- `frontend/src/continuousRipples.ts` — `OUTER_HOLD_DURATION_S` redefined from `(SITE_COUNT - 1) * STAGGER_S` (hold until site 4/innermost spawns) to `(SITE_COUNT - 3) * STAGGER_S` (hold until site 2/middle spawns); `OUTER_FADE_DURATION_S` redefined from `LIFE_S` (3s) to `STAGGER_S` (1s) — chosen so the fade finishes exactly when site 3 spawns, not an arbitrary shorter duration. Net effect: outer site's total life drops from ~7s to exactly `3 * STAGGER_S` = 3s, which happens to already equal sites 1-4's own `LIFE_S` — a deliberate, coherent re-timing (every one of the 5 pulses now shares the same 3s total lifespan) rather than an arbitrary new number for its own sake. Sites 1-4's own `LIFE_S`/`STAGGER_S` were left unchanged, since they already matched the new target once derived — there was nothing inconsistent left to adjust in them.
- `DEMO_SPEC.md` — Continuous scanning pulse subsection's outer-site bullet rewritten around the new hold-until-site-2/fade-until-site-3 timing, explicitly noting why the old innermost-spawn trigger was incompatible with the new requirement

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- Added temporary spawn/remove event logging (removed after) and captured a full 12s run (>2 cascade periods): confirmed in every one of 3 consecutive cycles that the outer sphere's removal timestamp (3.158, 7.942, 13.061) is always at-or-before site 3's spawn timestamp (3.158, 8.101, 13.061) — never after — directly verifying the stated requirement holds consistently cycle over cycle, not just in the first instance.

Remaining manual steps: none. Dev servers still running — http://localhost:5173/ / http://localhost:3001.

### 2026-08-03 — Subject moved to the floor's center

Request: the detected object should be around the center of the rectangular plane. Moved the subject from its original ~75%-toward-the-back-corner position (set in Sprint 8, unchanged through every subsequent sprint and this whole session) to the floor's exact center — a significant compositional change, since nearly every other element (the elevated scanning-source point the domes/sweep/continuous-pulse used to sit at, both ripple systems' death radius, the floor tint falloff) derives its position from the subject rather than being independently positioned.

Files touched:
- `frontend/src/main.ts` — `subjectPosition` simplified from a `SUBJECT_CORNER_FRACTION`-scaled offset toward the back corner to a flat `(0, 0, 0)`; the constant and its computation were removed entirely rather than left dangling at an unused value
- `frontend/src/subject.ts` — header comment updated (was describing the far/back-corner position)
- `DEMO_SPEC.md` — Subject bullet: position changed from "~70-80% toward the back corner... not floor center" to "at the CENTER of the floor" (the exact opposite of the old wording); Floor orientation bullet's reference to "the subject remains at its Sprint 8 position toward the back corner region" updated to point at the Subject bullet instead of restating a now-wrong position

Everything downstream picked this up automatically with no further code changes needed, since it was already built to derive from `subjectPosition`/`subject.position` rather than hold an independent hardcoded position: the elevated scanning-source point (domes' old anchor, now the sweep's and continuous pulse's), both ripple systems' death-radius corner-distance calculation, and the floor's confidence-scaled tint falloff.

Verification:
- `npx tsc --noEmit` — zero errors, frontend
- Idle-state screenshot: the sphere cluster and floor dot grid now read as centered on the floor's diamond silhouette, not offset toward one corner
- Escalated/resolved-state screenshot: subject (visible, fading to resolved green), the pulse-sphere cluster, and a live floor ripple ring are all correctly centered together on the floor — confirms every dependent system re-centered correctly, not just the subject mesh itself

Remaining manual steps: none for the code itself. This is a substantial composition change — worth a live look to confirm the overall balance (camera framing, dome-cluster-to-floor-edge proportions) still reads well now that the cluster sits center-floor rather than tucked toward one corner; not re-tuned as part of this change since it wasn't asked for and nothing looked obviously broken in the screenshots. Dev servers still running — http://localhost:5173/ / http://localhost:3001.

### 2026-08-03 — Reverted: subject moved back to the back-corner position

Request: undo the recent changes. Asked for scope, since "recent changes" could mean just the last edit or everything since the last GitHub push (several entries' worth) — user confirmed just the last one: the subject-centering change from the previous entry.

Files touched (exact reversal of the previous entry, nothing broader):
- `frontend/src/main.ts` — `subjectPosition` back to the `SUBJECT_CORNER_FRACTION`-scaled (~75% toward the back corner) computation
- `frontend/src/subject.ts` — header comment reverted to describe the far/back-corner position
- `DEMO_SPEC.md` — Subject bullet and Floor orientation bullet's subject-position reference both reverted to the back-corner wording; every other documentation update from today (outer-sphere retiming, back-left edge lengthening, growth-rate/rotation changes) was left untouched, since those weren't part of this undo

Verification:
- `git diff --stat` against the last pushed commit (848fda2) confirms `main.ts` and `subject.ts` now match it exactly (byte-for-byte on the parts that matter — their only net changes since the push were the ones just reverted), while `DEMO_SPEC.md` still shows the accumulated diff from every other change made today — confirms the revert was scoped precisely to the subject-centering change and nothing else leaked in or out
- `npx tsc --noEmit` — zero errors, frontend
- Idle-state screenshot: sphere cluster is back to sitting toward the back corner of the floor, matching the pre-centering composition

Remaining manual steps: none. Dev servers still running — http://localhost:5173/ / http://localhost:3001.
