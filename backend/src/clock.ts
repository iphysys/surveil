import { LOOP_DURATION_MS } from "./timeline";

const SERVER_START = Date.now();

export function getLoopElapsedSeconds(now: number = Date.now()): number {
  const elapsedMs = now - SERVER_START;
  return ((elapsedMs % LOOP_DURATION_MS) + LOOP_DURATION_MS) % LOOP_DURATION_MS / 1000;
}

export function getLoopIndex(now: number = Date.now()): number {
  return Math.floor((now - SERVER_START) / LOOP_DURATION_MS);
}
