/**
 * Sanitize GitSummary payloads before API responses / UI rendering.
 */

import type {
  GitSummary,
  GitSummaryBranch,
  GitSummaryCommit,
  GitWorkingTreeStatus,
} from "./visudev-api.types.js";

const MAX_COMMITS = 30;
const MAX_BRANCHES = 40;
const MAX_PATHS = 200;
const MAX_WARNINGS = 10;
const MAX_STRING_LEN = 200;
const MAX_SHA_LEN = 64;

function boundedString(value: unknown, maxLen = MAX_STRING_LEN): string {
  if (typeof value !== "string") return "";
  return value.slice(0, maxLen);
}

function boundedPathList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((entry): entry is string => typeof entry === "string")
    .slice(0, MAX_PATHS)
    .map((entry) => boundedString(entry, 512));
}

function normalizeCommit(value: unknown): GitSummaryCommit | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const sha = boundedString(raw.sha, MAX_SHA_LEN);
  if (!sha) return null;
  const committedAt = boundedString(raw.committedAt, 40);
  return {
    sha,
    subject: boundedString(raw.subject),
    committedAt: committedAt || new Date(0).toISOString(),
  };
}

function normalizeBranch(value: unknown): GitSummaryBranch | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const name = boundedString(raw.name);
  if (!name) return null;
  return {
    name,
    headSha: boundedString(raw.headSha, MAX_SHA_LEN),
  };
}

function normalizeWorkingTree(value: unknown): GitWorkingTreeStatus {
  if (!value || typeof value !== "object") {
    return { modified: [], added: [], deleted: [] };
  }
  const raw = value as Record<string, unknown>;
  return {
    modified: boundedPathList(raw.modified),
    added: boundedPathList(raw.added),
    deleted: boundedPathList(raw.deleted),
  };
}

export function normalizeGitSummary(value: unknown): GitSummary {
  if (!value || typeof value !== "object") {
    return {
      initialized: false,
      shallow: false,
      commits: [],
      branches: [],
      workingTree: { modified: [], added: [], deleted: [] },
    };
  }

  const raw = value as Record<string, unknown>;
  const commits = Array.isArray(raw.commits)
    ? raw.commits
        .map(normalizeCommit)
        .filter((commit): commit is GitSummaryCommit => commit != null)
        .slice(0, MAX_COMMITS)
    : [];
  const branches = Array.isArray(raw.branches)
    ? raw.branches
        .map(normalizeBranch)
        .filter((branch): branch is GitSummaryBranch => branch != null)
        .slice(0, MAX_BRANCHES)
    : [];
  const warnings = Array.isArray(raw.warnings)
    ? raw.warnings
        .filter((entry): entry is string => typeof entry === "string")
        .slice(0, MAX_WARNINGS)
        .map((entry) => boundedString(entry))
        .filter(Boolean)
    : undefined;

  return {
    initialized: raw.initialized === true,
    shallow: raw.shallow === true,
    currentRef: raw.currentRef ? boundedString(raw.currentRef, 120) : undefined,
    currentSha: raw.currentSha ? boundedString(raw.currentSha, MAX_SHA_LEN) : undefined,
    commits,
    branches,
    workingTree: normalizeWorkingTree(raw.workingTree),
    warnings: warnings?.length ? warnings : undefined,
    partial: raw.partial === true || (warnings?.length ?? 0) > 0,
  };
}
