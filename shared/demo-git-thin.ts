/**
 * Thin git summary detection and demo merge (mirrors demo-graph-thin).
 */

import { buildDemoGitSummary } from "./demo-git-summary.js";
import type { GitSummary } from "./visudev-api.types.js";

const MIN_COMMITS = 5;

export function isThinGitSummary(summary: GitSummary): boolean {
  return !summary.initialized || summary.commits.length < MIN_COMMITS;
}

function resolveWorkingTree(summary: GitSummary, demo: GitSummary) {
  const workingTree = summary.workingTree ?? demo.workingTree;
  return {
    modified:
      (workingTree.modified?.length ?? 0) > 0 ? workingTree.modified : demo.workingTree.modified,
    added: (workingTree.added?.length ?? 0) > 0 ? workingTree.added : demo.workingTree.added,
    deleted:
      (workingTree.deleted?.length ?? 0) > 0 ? workingTree.deleted : demo.workingTree.deleted,
  };
}

export function enrichGitSummaryIfThin(summary: GitSummary): GitSummary {
  if (!isThinGitSummary(summary)) return summary;

  const demo = buildDemoGitSummary();
  const existingShas = new Set(summary.commits.map((commit) => commit.sha));
  const mergedCommits = [
    ...summary.commits,
    ...demo.commits.filter((commit) => !existingShas.has(commit.sha)),
  ];

  return {
    ...summary,
    initialized: summary.initialized || demo.initialized,
    shallow: summary.shallow,
    commits: mergedCommits.length >= MIN_COMMITS ? mergedCommits : demo.commits,
    branches: (summary.branches?.length ?? 0) > 0 ? summary.branches : demo.branches,
    workingTree: resolveWorkingTree(summary, demo),
    warnings: summary.warnings,
    partial: summary.partial,
  };
}
