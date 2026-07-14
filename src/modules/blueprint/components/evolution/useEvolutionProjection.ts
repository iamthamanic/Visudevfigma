/**
 * Diff and graph projection memos for EvolutionView canvas.
 */

import { useMemo } from "react";
import type { SoftwareGraph } from "../../types";
import { diffSnapshots, findSnapshot } from "./_diff.js";
import { projectEvolutionGraph } from "./_projection.js";

export function useEvolutionProjection(
  graph: SoftwareGraph | undefined,
  baseSnapshotId: string | null,
  targetSnapshotId: string | null,
) {
  const diff = useMemo(() => {
    if (!graph || !baseSnapshotId || !targetSnapshotId) return null;
    const base = findSnapshot(graph, baseSnapshotId);
    const target = findSnapshot(graph, targetSnapshotId);
    if (!base || !target) return null;
    return diffSnapshots(graph, base, target);
  }, [graph, baseSnapshotId, targetSnapshotId]);

  const projection = useMemo(() => {
    if (!graph || !diff) return null;
    return projectEvolutionGraph(graph, diff);
  }, [graph, diff]);

  const hasDiffNodes = (projection?.nodes.length ?? 0) > 0;

  return { diff, projection, hasDiffNodes };
}
