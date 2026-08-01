// Mirrors backend/src/types.ts — must match DEMO_SPEC.md §2 exactly.
export interface DetectionEvent {
  id: string;
  timestamp: string; // ISO 8601
  sensor_modality: "camera" | "radar_sim" | "wifi_csi_sim";
  track_id: string;
  bearing: number; // degrees, 0-359
  distance_m: number;
  zone: string; // e.g. "Zone 3"
  confidence: number; // 0-1
  status: "idle" | "detected" | "escalated" | "resolved";
}
