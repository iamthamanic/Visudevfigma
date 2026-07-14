/**
 * Display helper tests for Evolution snapshot/git formatting.
 */

import { describe, it, expect } from "vitest";
import { displayText, formatCommitSha, formatSnapshotDate } from "./evolution-display.js";

describe("evolution-display", () => {
  it("formats valid snapshot dates", () => {
    expect(formatSnapshotDate("2026-01-02T00:00:00.000Z")).toBe("2026-01-02");
  });

  it("falls back for invalid snapshot dates", () => {
    expect(formatSnapshotDate("")).toBe("—");
    expect(formatSnapshotDate("bad")).toBe("—");
  });

  it("normalizes labels and commit shas", () => {
    expect(displayText("  hello  ")).toBe("hello");
    expect(displayText(undefined)).toBe("—");
    expect(formatCommitSha("abc")).toBe("—");
    expect(formatCommitSha("1234567890")).toBe("12345678");
  });
});
