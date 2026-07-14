/**
 * Tests for thin git summary demo enrichment.
 */

import { describe, expect, it } from "vitest";
import { enrichGitSummaryIfThin, isThinGitSummary } from "./demo-git-thin.js";

describe("demo-git-thin", () => {
  it("detects uninitialized or short commit lists as thin", () => {
    expect(
      isThinGitSummary({
        initialized: false,
        shallow: false,
        commits: [],
        branches: [],
        workingTree: { modified: [], added: [], deleted: [] },
      }),
    ).toBe(true);
    expect(
      isThinGitSummary({
        initialized: true,
        shallow: false,
        commits: [{ sha: "abc", subject: "one", committedAt: "2026-01-01" }],
        branches: [],
        workingTree: { modified: [], added: [], deleted: [] },
      }),
    ).toBe(true);
  });

  it("handles partial workingTree without throwing", () => {
    const enriched = enrichGitSummaryIfThin({
      initialized: false,
      shallow: false,
      commits: [],
      branches: [],
      workingTree: { modified: [], added: [], deleted: [] },
    });
    expect(enriched.commits.length).toBeGreaterThanOrEqual(3);
  });

  it("merges demo commits without dropping existing repo data", () => {
    const enriched = enrichGitSummaryIfThin({
      initialized: true,
      shallow: false,
      commits: [{ sha: "real123", subject: "Real commit", committedAt: "2026-01-01" }],
      branches: [{ name: "feature/x", headSha: "real123" }],
      workingTree: { modified: ["src/a.ts"], added: [], deleted: [] },
    });
    expect(enriched.commits.some((commit) => commit.sha === "real123")).toBe(true);
    expect(enriched.commits.length).toBeGreaterThanOrEqual(3);
    expect(enriched.branches[0]?.name).toBe("feature/x");
    expect(enriched.workingTree.modified).toEqual(["src/a.ts"]);
  });
});
