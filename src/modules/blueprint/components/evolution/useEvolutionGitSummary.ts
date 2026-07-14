/**
 * Loads git summary for EvolutionView when local mode is active.
 */

import { useEffect, useState } from "react";
import {
  isEvolutionGitAvailable,
  loadEvolutionGitSummary,
} from "../../services/evolution-git.service";
import type { GitSummary } from "../../types";

export type EvolutionGitLoader = (projectId: string) => Promise<GitSummary>;

export function useEvolutionGitSummary(
  projectId: string | undefined,
  loader: EvolutionGitLoader = loadEvolutionGitSummary,
  isAvailable: () => boolean = isEvolutionGitAvailable,
) {
  const [gitSummary, setGitSummary] = useState<GitSummary | null>(null);
  const [gitLoadError, setGitLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!projectId || !isAvailable()) {
      setGitSummary(null);
      setGitLoadError(null);
      return;
    }

    let cancelled = false;
    void loader(projectId)
      .then((summary) => {
        if (!cancelled) {
          setGitSummary(summary);
          setGitLoadError(null);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setGitLoadError("Git-Zusammenfassung nicht verfügbar");
          setGitSummary({
            initialized: false,
            shallow: false,
            commits: [],
            branches: [],
            workingTree: { modified: [], added: [], deleted: [] },
          });
        }
      });

    return () => {
      cancelled = true;
    };
  }, [projectId, loader, isAvailable]);

  return { gitSummary, gitLoadError };
}
