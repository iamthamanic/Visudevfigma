/**
 * Projekt-Quelle (GitHub vs. lokaler Pfad) für Preview und Scans.
 * Ort: src/lib/visudev/project-source.ts
 */

import type { Project, ProjectSourceMode } from "./types";

export function getProjectSourceMode(project: {
  source_mode?: ProjectSourceMode;
  github_repo?: string;
  local_path?: string;
}): ProjectSourceMode {
  if (project.source_mode === "local" || project.source_mode === "github") {
    return project.source_mode;
  }
  if (project.local_path?.trim() && !project.github_repo?.trim()) return "local";
  return "github";
}

export function hasPreviewSource(project: Project): boolean {
  const mode = getProjectSourceMode(project);
  if (mode === "local") return Boolean(project.local_path?.trim());
  return Boolean(project.github_repo?.trim());
}

export function resolvePreviewStartParams(project: Project): {
  repo?: string;
  branchOrCommit?: string;
  commitSha?: string;
  localPath?: string;
} {
  if (getProjectSourceMode(project) === "local") {
    return { localPath: project.local_path?.trim() || undefined };
  }
  return {
    repo: project.github_repo,
    branchOrCommit: project.github_branch,
    commitSha: project.lastAnalyzedCommitSha,
  };
}

/** Last path segment for auto-naming projects from a local folder pick. */
export function projectNameFromLocalPath(localPath: string): string {
  const trimmed = localPath.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  const parts = trimmed.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? "";
}
