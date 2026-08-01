import type { DetectionEvent } from "./types";

// HUD per DEMO_SPEC.md §4: top banner (label + timestamp, visible only when
// status !== "idle") and a right panel with fields in the specified order.
export function createHud(root: HTMLElement): void {
  const hud = document.createElement("div");
  hud.className = "hud";
  hud.innerHTML = `
    <div class="hud-banner" id="hud-banner">
      <span class="hud-banner-label" id="hud-banner-label">DETECTED</span>
      <span class="hud-banner-timestamp" id="hud-banner-timestamp">--:--:--</span>
    </div>
    <div class="hud-panel" id="hud-panel">
      <div class="hud-row"><span class="hud-key">sensor_modality</span><span class="hud-value" id="hud-sensor_modality">—</span></div>
      <div class="hud-row"><span class="hud-key">track_id</span><span class="hud-value" id="hud-track_id">—</span></div>
      <div class="hud-row"><span class="hud-key">bearing</span><span class="hud-value" id="hud-bearing">—</span></div>
      <div class="hud-row"><span class="hud-key">distance_m</span><span class="hud-value" id="hud-distance_m">—</span></div>
      <div class="hud-row"><span class="hud-key">confidence</span><span class="hud-value" id="hud-confidence">—</span></div>
      <div class="hud-row"><span class="hud-key">zone</span><span class="hud-value" id="hud-zone">—</span></div>
      <div class="hud-row"><span class="hud-key">status</span><span class="hud-value" id="hud-status">idle</span></div>
    </div>
    <div class="disclosure-tag">Simulated scenario — synthetic detection feed</div>
  `;
  root.appendChild(hud);
}

function setText(id: string, text: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
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
  if (banner) {
    banner.dataset.status = event.status;
  }
  setText("hud-banner-label", event.status.toUpperCase());
  setText(
    "hud-banner-timestamp",
    new Date(event.timestamp).toLocaleTimeString(),
  );
}
