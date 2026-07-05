/**
 * Sliding-window rate limit for expensive POST /blueprint/analyze.
 * get-then-set is not atomic; see docs/AI_REVIEW_ACCEPTED_TRADEOFFS.md.
 */

import type {
  LoggerLike,
  SupabaseClientLike,
} from "../../interfaces/module.interface.ts";

const WINDOW_MS = 60_000;
const MAX_BLUEPRINT_ANALYZE_PER_WINDOW = 6;

interface RateWindow {
  count: number;
  windowStart: string;
}

export class BlueprintRateLimitService {
  constructor(
    private readonly supabase: SupabaseClientLike,
    private readonly kvTableName: string,
    private readonly logger: LoggerLike,
  ) {}

  public async allow(scopeKey: string): Promise<boolean> {
    const key = `rate:blueprint-analyze:${scopeKey}`;
    const { data, error } = await this.supabase
      .from(this.kvTableName)
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      this.logger.warn("Blueprint rate limit KV read failed", {
        error: error.message,
      });
      return true;
    }

    const raw = (data?.value ?? null) as RateWindow | null;
    const now = Date.now();
    const windowStartMs = raw?.windowStart
      ? new Date(raw.windowStart).getTime()
      : 0;
    const inWindow = now - windowStartMs < WINDOW_MS;
    const prevCount = inWindow && typeof raw?.count === "number"
      ? raw.count
      : 0;
    const count = prevCount + 1;

    if (count > MAX_BLUEPRINT_ANALYZE_PER_WINDOW) {
      return false;
    }

    const nextWindow: RateWindow = {
      count,
      windowStart: inWindow
        ? (raw?.windowStart ?? new Date(now).toISOString())
        : new Date(now).toISOString(),
    };

    const { error: writeError } = await this.supabase
      .from(this.kvTableName)
      .upsert({ key, value: nextWindow });

    if (writeError) {
      this.logger.warn("Blueprint rate limit KV write failed", {
        error: writeError.message,
      });
    }

    return true;
  }
}
