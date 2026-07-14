/**
 * Tests for git summary reader on initialized repositories.
 */

import { describe, expect, it } from "vitest";
import { readGitSummary, type GitCommandRunner } from "./git-summary.js";

describe("readGitSummary", () => {
  it("returns uninitialized summary for missing repo path", async () => {
    const summary = await readGitSummary("/tmp/visudev-nonexistent-repo-path");
    expect(summary.initialized).toBe(false);
    expect(summary.commits).toHaveLength(0);
    expect(summary.warnings?.length).toBeGreaterThan(0);
  });

  it("reads commits from the current workspace repository", async () => {
    const summary = await readGitSummary(process.cwd());
    expect(summary.initialized).toBe(true);
    expect(summary.commits.length).toBeGreaterThan(0);
  });

  it("parses commit subjects containing pipe characters", async () => {
    const runGit: GitCommandRunner = async (_repoPath, args) => {
      if (args.includes("rev-parse") && args.includes("--is-inside-work-tree")) return "true\n";
      if (args.includes("--is-shallow-repository")) return "false\n";
      if (args.includes("symbolic-ref")) return "main\n";
      if (args[0] === "rev-parse" && args[1] === "HEAD") return "abc123\n";
      if (args[0] === "log") {
        return `sha1${"\0"}fix: a|b|c${"\0"}1740000000${"\0"}`;
      }
      if (args[0] === "for-each-ref") return "main\0sha1\0";
      if (args[0] === "status") return "";
      return "";
    };

    const summary = await readGitSummary("/tmp/fake", runGit);
    expect(summary.commits).toEqual([
      {
        sha: "sha1",
        subject: "fix: a|b|c",
        committedAt: new Date(1_740_000_000 * 1000).toISOString(),
      },
    ]);
  });

  it("surfaces partial failures instead of silent fallbacks", async () => {
    const runGit: GitCommandRunner = async (_repoPath, args) => {
      if (args.includes("rev-parse") && args.includes("--is-inside-work-tree")) return "true\n";
      if (args.includes("--is-shallow-repository")) return "false\n";
      if (args[0] === "rev-parse" && args[1] === "HEAD") throw new Error("no head");
      if (args[0] === "symbolic-ref") return "main\n";
      if (args[0] === "log") return "";
      if (args[0] === "for-each-ref") return "";
      if (args[0] === "status") return "";
      return "";
    };

    const summary = await readGitSummary("/tmp/fake", runGit);
    expect(summary.initialized).toBe(true);
    expect(summary.partial).toBe(true);
    expect(summary.warnings?.some((warning) => warning.includes("current-sha"))).toBe(true);
  });
});
