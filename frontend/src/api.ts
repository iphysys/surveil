import type { DetectionEvent } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/events";
// Tightened from 1000ms (Sprint 2) per DEMO_SPEC.md §4a's Sprint 7
// micro-flicker requirement — frequent enough for HUD values to visibly
// tick rather than step once a second.
const POLL_INTERVAL_MS = 400;

// Polls the backend and reports each response.
export function pollEvents(
  onUpdate: (event: DetectionEvent) => void,
  intervalMs: number = POLL_INTERVAL_MS,
): void {
  async function tick(): Promise<void> {
    try {
      const res = await fetch(API_URL);
      if (!res.ok) return;
      const data = (await res.json()) as DetectionEvent;
      onUpdate(data);
    } catch (err) {
      console.error("[surveil] poll failed", err);
    }
  }

  tick();
  setInterval(tick, intervalMs);
}
