/**
 * Composes EvolutionView state hooks — snapshots, git summary, diff projection.
 */

import { useMemo } from "react";
import type { BlueprintData } from "../../types";
import { useEvolutionGitSummary } from "./useEvolutionGitSummary.js";
import { useEvolutionProjection } from "./useEvolutionProjection.js";
import { useEvolutionSnapshotSelection } from "./useEvolutionSnapshotSelection.js";

export function useEvolutionViewState(blueprint: BlueprintData, projectId?: string) {
  const graph = blueprint.graph;
  const snapshots = useMemo(
    () => (Array.isArray(graph?.snapshots) ? graph.snapshots : []),
    [graph?.snapshots],
  );

  const { gitSummary, gitLoadError } = useEvolutionGitSummary(projectId);
  const { baseSnapshotId, targetSnapshotId, setBaseSnapshotId, setTargetSnapshotId } =
    useEvolutionSnapshotSelection(snapshots);
  const { diff, projection, hasDiffNodes } = useEvolutionProjection(
    graph,
    baseSnapshotId,
    targetSnapshotId,
  );

  return {
    graph,
    snapshots,
    gitSummary,
    gitLoadError,
    baseSnapshotId,
    targetSnapshotId,
    setBaseSnapshotId,
    setTargetSnapshotId,
    diff,
    projection,
    hasDiffNodes,
  };
}
