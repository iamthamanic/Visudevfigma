/**
 * Rate limiting for visudev-server. Single responsibility: sliding-window rate checks.
 */
const RATE_WINDOW_MS = 60_000;

export type KvLike = {
  get: (key: string) => Promise<unknown>;
  set: (key: string, value: unknown) => Promise<void>;
};

export function createCheckRateLimit(kvStore: KvLike) {
  return async function checkRateLimit(
    key: string,
    maxPerWindow: number,
  ): Promise<boolean> {
    const raw = (await kvStore.get(key)) as
      | { count?: number; windowStart?: string }
      | null;
    const now = Date.now();
    const windowStartMs = raw?.windowStart
      ? new Date(raw.windowStart).getTime()
      : 0;
    const inWindow = now - windowStartMs < RATE_WINDOW_MS;
    const prevCount = inWindow && typeof raw?.count === "number"
      ? raw.count
      : 0;
    const count = prevCount + 1;
    if (count > maxPerWindow) return false;
    const newWindowStart = inWindow
      ? (raw?.windowStart ?? new Date(now).toISOString())
      : new Date(now).toISOString();
    await kvStore.set(key, { count, windowStart: newWindowStart });
    return true;
  };
}

import { kv } from "./kv.ts";
export const checkRateLimit = createCheckRateLimit(kv);

export const RATE_MAX_LOGS_PER_WINDOW = 120;
export const RATE_MAX_PROJECTS_PER_WINDOW = 30;
