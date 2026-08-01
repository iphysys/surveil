import { DetectionEvent } from "./types";
import {
  PHASE_BOUNDARIES_S,
  TRACK_ID,
  ZONE,
  SENSOR_MODALITY,
  DETECTED,
  ESCALATED,
} from "./timeline";
import { getLoopElapsedSeconds, getLoopIndex } from "./clock";
import { jitter } from "./jitter";

const BLANK = { track_id: "", bearing: 0, distance_m: 0, confidence: 0, zone: "" };

export function getCurrentEvent(now: number = Date.now()): DetectionEvent {
  const t = getLoopElapsedSeconds(now);
  const loopIndex = getLoopIndex(now);
  const timestamp = new Date(now).toISOString();

  let status: DetectionEvent["status"];
  let fields: Pick<DetectionEvent, "track_id" | "bearing" | "distance_m" | "confidence" | "zone">;

  if (t < PHASE_BOUNDARIES_S.idleEnd) {
    status = "idle";
    fields = BLANK;
  } else if (t < PHASE_BOUNDARIES_S.detectedEnd) {
    status = "detected";
    const phaseS = t - PHASE_BOUNDARIES_S.idleEnd;
    const phaseLengthS = PHASE_BOUNDARIES_S.detectedEnd - PHASE_BOUNDARIES_S.idleEnd;
    const ratio = phaseS / phaseLengthS;
    fields = {
      track_id: TRACK_ID,
      bearing: DETECTED.bearing,
      distance_m: DETECTED.distance_m,
      confidence: DETECTED.confidenceStart + ratio * (DETECTED.confidenceEnd - DETECTED.confidenceStart),
      zone: ZONE,
    };
  } else if (t < PHASE_BOUNDARIES_S.escalatedEnd) {
    status = "escalated";
    const phaseMs = (t - PHASE_BOUNDARIES_S.detectedEnd) * 1000;
    fields = {
      track_id: TRACK_ID,
      bearing: jitter(phaseMs, ESCALATED.bearingRange[0], ESCALATED.bearingRange[1]),
      distance_m: jitter(phaseMs * 1.37 + 900, ESCALATED.distanceRange[0], ESCALATED.distanceRange[1]),
      confidence: jitter(phaseMs * 0.83 + 1700, ESCALATED.confidenceRange[0], ESCALATED.confidenceRange[1]),
      zone: ZONE,
    };
  } else {
    status = "resolved";
    fields = BLANK;
  }

  return {
    id: `${loopIndex}-${status}`,
    timestamp,
    sensor_modality: SENSOR_MODALITY,
    status,
    ...fields,
  };
}
