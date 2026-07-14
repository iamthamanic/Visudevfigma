/**
 * Tests for GitSummary normalization before UI/API consumption.
 */

import { describe, expect, it } from "vitest";
import { normalizeGitSummary } from "./git-summary-normalize.js";

describe("normalizeGitSummary", () => {
  it("returns empty summary for invalid payloads", () => {
    expect(normalizeGitSummary(null).initialized).toBe(false);
    expect(normalizeGitSummary("bad").commits).toEqual([]);
  });

  it("bounds commit subjects and warning text", () => {
    const summary = normalizeGitSummary({
      initialized: true,
      shallow: false,
      commits: [{ sha: "a".repeat(100), subject: "s".repeat(300), committedAt: "2026-01-01" }],
      branches: [],
      workingTree: { modified: [], added: [], deleted: [] },
      warnings: ["w".repeat(400)],
    });

    expect(summary.commits[0]?.sha.length).toBe(64);
    expect(summary.commits[0]?.subject.length).toBe(200);
    expect(summary.warnings?.[0]?.length).toBe(200);
  });
});
