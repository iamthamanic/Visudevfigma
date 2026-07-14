/**
 * Reads a safe git summary (commits, branches, working tree) for a validated repo path.
 */

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import type {
  GitSummary,
  GitSummaryBranch,
  GitSummaryCommit,
  GitWorkingTreeStatus,
} from "../../../shared/visudev-api.types.js";

const execFileAsync = promisify(execFile);
const MAX_COMMITS = 30;
const MAX_BRANCHES = 40;

export type GitCommandRunner = (repoPath: string, args: string[]) => Promise<string>;

async function runGitDefault(repoPath: string, args: string[]): Promise<string> {
  const { stdout } = await execFileAsync("git", ["-C", repoPath, ...args], {
    maxBuffer: 2 * 1024 * 1024,
  });
  return stdout;
}

function emptySummary(): GitSummary {
  return {
    initialized: false,
    shallow: false,
    commits: [],
    branches: [],
    workingTree: { modified: [], added: [], deleted: [] },
  };
}

function withWarnings(summary: GitSummary, warnings: string[]): GitSummary {
  if (warnings.length === 0) return summary;
  return { ...summary, warnings, partial: true };
}

function parseCommitsZ(raw: string): GitSummaryCommit[] {
  if (!raw) return [];
  const records = raw.split("\0").filter((record) => record.length > 0);
  const commits: GitSummaryCommit[] = [];
  for (let index = 0; index + 2 < records.length && commits.length < MAX_COMMITS; index += 3) {
    const sha = records[index];
    const subject = records[index + 1] ?? "";
    const seconds = Number(records[index + 2]);
    if (!sha) continue;
    commits.push({
      sha,
      subject,
      committedAt: Number.isFinite(seconds)
        ? new Date(seconds * 1000).toISOString()
        : new Date(0).toISOString(),
    });
  }
  return commits;
}

function parseBranchesZ(raw: string): GitSummaryBranch[] {
  if (!raw) return [];
  const records = raw.split("\0").filter((record) => record.length > 0);
  const branches: GitSummaryBranch[] = [];
  for (let index = 0; index + 1 < records.length && branches.length < MAX_BRANCHES; index += 2) {
    const name = records[index];
    const headSha = records[index + 1] ?? "";
    if (!name) continue;
    branches.push({ name, headSha });
  }
  return branches;
}

function parseWorkingTreeZ(raw: string): GitWorkingTreeStatus {
  const workingTree: GitWorkingTreeStatus = { modified: [], added: [], deleted: [] };
  const records = raw.split("\0").filter((record) => record.length > 0);
  let index = 0;
  while (index < records.length) {
    const entry = records[index];
    index += 1;
    if (entry.length < 4) continue;
    const status = entry.slice(0, 2);
    const firstPath = entry.slice(3);
    const isRenameOrCopy =
      status[0] === "R" || status[1] === "R" || status[0] === "C" || status[1] === "C";
    const filePath = isRenameOrCopy && index < records.length ? records[index++] : firstPath;
    if (!filePath) continue;
    if (status.includes("D")) workingTree.deleted.push(filePath);
    else if (status.includes("A") || status.includes("?")) workingTree.added.push(filePath);
    else workingTree.modified.push(filePath);
  }
  return workingTree;
}

async function safeGitRun(
  runGit: GitCommandRunner,
  repoPath: string,
  label: string,
  args: string[],
  warnings: string[],
): Promise<string | null> {
  try {
    return await runGit(repoPath, args);
  } catch {
    warnings.push(`${label}: unavailable`);
    return null;
  }
}

export async function readGitSummary(
  repoPath: string,
  runGit: GitCommandRunner = runGitDefault,
): Promise<GitSummary> {
  const warnings: string[] = [];

  const inside = await safeGitRun(
    runGit,
    repoPath,
    "rev-parse",
    ["rev-parse", "--is-inside-work-tree"],
    warnings,
  );
  if (inside?.trim() !== "true") {
    return withWarnings(emptySummary(), warnings);
  }

  const shallowRaw = await safeGitRun(
    runGit,
    repoPath,
    "shallow-check",
    ["rev-parse", "--is-shallow-repository"],
    warnings,
  );
  const shallow = shallowRaw?.trim() === "true";

  const [currentSha, currentRef, commitRaw, branchRaw, statusRaw] = await Promise.all([
    safeGitRun(runGit, repoPath, "current-sha", ["rev-parse", "HEAD"], warnings),
    safeGitRun(runGit, repoPath, "current-ref", ["symbolic-ref", "--short", "HEAD"], warnings),
    safeGitRun(
      runGit,
      repoPath,
      "commits",
      ["log", "-n", String(MAX_COMMITS), "-z", "--format=%H%x00%s%x00%ct%x00"],
      warnings,
    ),
    safeGitRun(
      runGit,
      repoPath,
      "branches",
      ["for-each-ref", "--format=%(refname:short)%x00%(objectname:short)%x00", "refs/heads"],
      warnings,
    ),
    safeGitRun(runGit, repoPath, "working-tree", ["status", "--porcelain", "-z"], warnings),
  ]);

  return withWarnings(
    {
      initialized: true,
      shallow,
      currentSha: currentSha?.trim() || undefined,
      currentRef: currentRef?.trim() || undefined,
      commits: parseCommitsZ(commitRaw ?? ""),
      branches: parseBranchesZ(branchRaw ?? ""),
      workingTree: parseWorkingTreeZ(statusRaw ?? ""),
    },
    warnings,
  );
}
