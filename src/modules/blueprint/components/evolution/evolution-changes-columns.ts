/**
 * Pure column model for Evolution changes grid (paths + counts from git/diff).
 */

import type { GitSummary, SoftwareGraphDiffMetadata } from "../../types";

export interface EvolutionChangesColumn {
  id: string;
  label: string;
  count: number;
  paths: string[];
}

export function buildEvolutionChangesColumns(
  diff: SoftwareGraphDiffMetadata | null,
  gitSummary: GitSummary | null,
): EvolutionChangesColumn[] {
  const addedPaths = (gitSummary?.workingTree.added ?? []).slice(0, 4);
  const changedPaths = (gitSummary?.workingTree.modified ?? []).slice(0, 6);
  const removedPaths = (gitSummary?.workingTree.deleted ?? []).slice(0, 3);
  const dependencyPaths = changedPaths
    .filter((path) => /package|lock|dependency|pom|gradle/i.test(path))
    .slice(0, 3);

  return [
    {
      id: "added",
      label: "Neue Module",
      count: Math.max(diff?.addedNodeIds.length ?? 0, addedPaths.length),
      paths: addedPaths,
    },
    {
      id: "changed",
      label: "Geänderte Module",
      count: Math.max(diff?.changedNodeIds.length ?? 0, changedPaths.length),
      paths: changedPaths,
    },
    {
      id: "removed",
      label: "Entfernte Module",
      count: Math.max(diff?.removedNodeIds.length ?? 0, removedPaths.length),
      paths: removedPaths,
    },
    {
      id: "deps",
      label: "Top Dependency-Änderungen",
      count: dependencyPaths.length,
      paths: dependencyPaths,
    },
  ];
}
