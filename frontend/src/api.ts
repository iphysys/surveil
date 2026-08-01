import type { DetectionEvent } from "./types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001/api/events";
const POLL_INTERVAL_MS = 1000;

// Polls the backend and reports each response. Sprint 2 only needs to
// confirm connectivity — the callback isn't wired into the HUD/scene
// until Sprint 3.
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
