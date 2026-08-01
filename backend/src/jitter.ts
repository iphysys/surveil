// Deterministic pseudo-random oscillation for the escalated-hold phase.
// DEMO_SPEC.md §3 only specifies ranges, not an algorithm; a sine wave
// keeps values reproducible from elapsed time alone (no stored RNG state).
export function jitter(seedMs: number, min: number, max: number): number {
  const wave = (Math.sin(seedMs / 600) + 1) / 2; // 0..1
  return min + wave * (max - min);
}
