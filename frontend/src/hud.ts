import type { DetectionEvent } from "./types";

const MAX_LOG_ROWS = 6;
const LOG_ROW_MIN_OPACITY = 0.3;

// HUD per DEMO_SPEC.md §4 (layout) + §4a (restyle + Sprint 7 amendments):
// top banner (label + timestamp, visible only when status !== "idle"),
// top-left brand block, left EVENT LOG panel, top-right SIMULATED pill +
// field panel, bottom-center scenario pill, bottom-right disclosure tag.
export function createHud(root: HTMLElement): void {
  const hud = document.createElement("div");
  hud.className = "hud";
  hud.innerHTML = `
    <div class="brand-block">
      <div class="brand-word">iPhySys</div>
      <div class="brand-subtitle">PERIMETER SENSING DEMO — SYNTHETIC DATA</div>
    </div>

    <div class="hud-panel event-log-panel" id="event-log-panel">
      <div class="hud-panel-header">Event log</div>
      <div id="event-log-rows"></div>
    </div>

    <div class="hud-banner" id="hud-banner">
      <span class="hud-banner-label" id="hud-banner-label">DETECTED</span>
      <span class="hud-banner-timestamp" id="hud-banner-timestamp">--:--:--</span>
    </div>

    <div class="top-right-stack">
      <div class="simulated-pill">SIMULATED</div>
      <div class="hud-panel" id="hud-panel">
        <div class="hud-panel-header">Detection feed</div>
        <div class="hud-row"><span class="hud-key">sensor_modality</span><span class="hud-value" id="hud-sensor_modality">—</span></div>
        <div class="hud-row"><span class="hud-key">track_id</span><span class="hud-value" id="hud-track_id">—</span></div>
        <div class="hud-row"><span class="hud-key">bearing</span><span class="hud-value" id="hud-bearing">—</span></div>
        <div class="hud-row"><span class="hud-key">distance_m</span><span class="hud-value" id="hud-distance_m">—</span></div>
        <div class="hud-row"><span class="hud-key">confidence</span><span class="hud-value" id="hud-confidence">—</span></div>
        <div class="hud-row"><span class="hud-key">zone</span><span class="hud-value" id="hud-zone">—</span></div>
        <div class="hud-row"><span class="hud-key">status</span><span class="hud-value" id="hud-status">idle</span></div>
      </div>
    </div>

    <div class="scenario-pill">SCENARIO: PERIMETER BREACH — SYNTHETIC</div>

    <div class="disclosure-tag">Simulated scenario — synthetic detection feed</div>
  `;
  root.appendChild(hud);
}

function setText(id: string, text: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// Formats one EVENT LOG line, e.g. "01:41:16 ESCALATED trk-001 zone 3".
function formatLogEntry(event: DetectionEvent): string {
  const time = new Date(event.timestamp).toLocaleTimeString();
  const parts = [time, event.status.toUpperCase()];
  if (event.track_id) parts.push(event.track_id);
  if (event.zone) parts.push(`zone ${event.zone.replace(/^Zone\s+/i, "")}`);
  return parts.join(" ");
}

let previousStatus: DetectionEvent["status"] | null = null;
const logEntries: string[] = [];

function renderLog(): void {
  const container = document.getElementById("event-log-rows");
  if (!container) return;
  container.innerHTML = logEntries
    .map((text, i) => {
      const opacity = Math.max(LOG_ROW_MIN_OPACITY, 1 - i * 0.15);
      return `<div class="event-log-row" style="opacity:${opacity}">${text}</div>`;
    })
    .join("");
}

export function updateHud(event: DetectionEvent): void {
  const hasTrack = event.track_id !== "";

  setText("hud-sensor_modality", event.sensor_modality);
  setText("hud-track_id", hasTrack ? event.track_id : "—");
  setText("hud-bearing", hasTrack ? `${event.bearing.toFixed(0)}°` : "—");
  setText("hud-distance_m", hasTrack ? `${event.distance_m.toFixed(1)} m` : "—");
  setText("hud-confidence", hasTrack ? event.confidence.toFixed(2) : "—");
  setText("hud-zone", event.zone !== "" ? event.zone : "—");
  setText("hud-status", event.status);

  const banner = document.getElementById("hud-banner");
  if (banner) banner.dataset.status = event.status;
  const panel = document.getElementById("hud-panel");
  if (panel) panel.dataset.status = event.status;

  setText("hud-banner-label", event.status.toUpperCase());
  setText(
    "hud-banner-timestamp",
    new Date(event.timestamp).toLocaleTimeString(),
  );

  if (event.status !== previousStatus) {
    previousStatus = event.status;
    logEntries.unshift(formatLogEntry(event));
    logEntries.length = Math.min(logEntries.length, MAX_LOG_ROWS);
    renderLog();
  }
}
