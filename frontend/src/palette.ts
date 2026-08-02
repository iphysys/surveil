// Palette per DEMO_SPEC.md §5. Two-tone scheme (Sprint 7 amendment):
// STRUCTURE (floor grid, idle-state sweep) uses the blue-gray family;
// THREAT/ALERT (subject, pulse rings, alert-state sweep, HUD accents)
// uses the red family and must never share a hue with structure.
// Background/threat-red/structure-blue are exact/family-given in §5;
// resolved green is only qualitative ("muted green") — placeholder hex.
export const BACKGROUND_HEX = 0x0a0d12;
export const STRUCTURE_ACCENT_HEX = 0x7a8fa6;
export const ALERT_ACCENT_HEX = 0xe24b4a; // detected + escalated
export const RESOLVED_ACCENT_HEX = 0x4caf7d;
// Continuous scanning pulse only — a distinct, saturated "neon blue" (not
// the muted structure blue-gray), per explicit request. Not yet in
// DEMO_SPEC.md §5's formal two-tone palette family; flagged there.
export const CONTINUOUS_PULSE_HEX = 0x00d4ff;

export const BACKGROUND_CSS = "#0a0d12";
export const STRUCTURE_ACCENT_CSS = "#7a8fa6";
export const ALERT_ACCENT_CSS = "#e24b4a";
export const RESOLVED_ACCENT_CSS = "#4caf7d";
