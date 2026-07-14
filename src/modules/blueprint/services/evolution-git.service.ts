/**
 * Evolution git summary access — module service boundary for Blueprint UI.
 */

import { getVisuDevClient, isLocalVisuDevMode } from "../../../lib/visudev-api";
import { normalizeGitSummary } from "../../../lib/visudev/normalize-git-summary";
import type { GitSummary } from "../types";

export function isEvolutionGitAvailable(): boolean {
  return isLocalVisuDevMode();
}

export async function loadEvolutionGitSummary(projectId: string): Promise<GitSummary> {
  const summary = await getVisuDevClient().getGitSummary(projectId);
  return normalizeGitSummary(summary);
}
