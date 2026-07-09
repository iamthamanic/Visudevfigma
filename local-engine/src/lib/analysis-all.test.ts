/**
 * Unit tests for scanType=all aggregation helpers.
 * Location: local-engine/src/lib/analysis-all.test.ts
 */

import { describe, expect, it } from "vitest";
import { aggregateParentStatus } from "./analysis-all.js";

describe("aggregateParentStatus", () => {
  it("returns running while any child is running", () => {
    expect(aggregateParentStatus(["success", "running", "queued"])).toBe("running");
  });

  it("returns success when all children succeeded", () => {
    expect(aggregateParentStatus(["success", "success", "success"])).toBe("success");
  });

  it("returns failed when all children failed", () => {
    expect(aggregateParentStatus(["failed", "failed", "failed"])).toBe("failed");
  });

  it("returns partial for mixed terminal outcomes", () => {
    expect(aggregateParentStatus(["success", "failed", "success"])).toBe("partial");
    expect(aggregateParentStatus(["partial", "failed", "success"])).toBe("partial");
  });
});
