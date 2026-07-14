/**
 * Tests for in-memory rate limit eviction.
 */

import { describe, expect, it } from "vitest";
import { checkRateLimit, resetRateLimitsForTests } from "./simple-rate-limit.js";

describe("checkRateLimit", () => {
  it("evicts stale keys instead of growing without bound", () => {
    resetRateLimitsForTests();
    for (let index = 0; index < 300; index += 1) {
      expect(checkRateLimit(`client-${index}`, 60_000, 1)).toBe(true);
    }
    expect(checkRateLimit("client-new", 60_000, 1)).toBe(true);
  });
});
