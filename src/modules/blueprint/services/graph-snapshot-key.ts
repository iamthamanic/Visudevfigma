/**
 * Detects graph reloads so inspector auto-select resets on project/scan changes.
 */

import type { SoftwareGraph } from "../types";

export function buildGraphSnapshotKey(graph: SoftwareGraph | null | undefined): string {
  if (!graph) return "";
  const nodeCount = graph.nodes?.length ?? 0;
  const edgeCount = graph.edges?.length ?? 0;
  const analyzedAt = graph.analyzedAt ?? "unknown";
  return `${graph.projectId}:${nodeCount}:${edgeCount}:${analyzedAt}`;
}
