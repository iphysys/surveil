// Scripted sequence data — literal values from DEMO_SPEC.md §3.
// Instant rows (t=3, 5, 9, 12) are phase boundaries, not separate states:
// there are five phases — idle, detected-ramping, escalated-hold,
// resolved-hold, then loop back to idle.

export const LOOP_DURATION_S = 12;
export const LOOP_DURATION_MS = LOOP_DURATION_S * 1000;

export const PHASE_BOUNDARIES_S = {
  idleEnd: 3,
  detectedEnd: 5,
  escalatedEnd: 9,
  resolvedEnd: 12,
} as const;

export const TRACK_ID = "trk-001";
export const ZONE = "Zone 3";
export const SENSOR_MODALITY = "radar_sim" as const;

// detected-ramping phase (3-5s): bearing/distance flat, confidence ramps linearly
export const DETECTED = {
  bearing: 214,
  distance_m: 38,
  confidenceStart: 0.61,
  confidenceEnd: 0.97,
} as const;

// escalated-hold phase (5-9s): all three fields jitter within range
export const ESCALATED = {
  bearingRange: [213, 216] as [number, number],
  distanceRange: [30, 35] as [number, number],
  confidenceRange: [0.95, 0.98] as [number, number],
} as const;
