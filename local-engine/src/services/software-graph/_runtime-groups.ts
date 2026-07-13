/**
 * Groups file nodes by inferred runtime.
 */

import type { SoftwareGraphGroup, SoftwareGraphNode } from "../../types/api.types.js";

export function buildRuntimeGroups(nodes: SoftwareGraphNode[]): SoftwareGraphGroup[] {
  const groups = new Map<string, string[]>();
  for (const node of nodes) {
    if (node.kind === "file" && node.metadata.runtime) {
      const runtime = node.metadata.runtime as string;
      const list = groups.get(runtime) ?? [];
      list.push(node.id);
      groups.set(runtime, list);
    }
  }
  return [...groups.entries()].map(([runtime, nodeIds]) => ({
    id: `group:runtime:${runtime}`,
    kind: "file" as const,
    label: runtime,
    nodeIds,
  }));
}

export function dropDanglingEdges(
  edges: import("../../types/api.types.js").SoftwareGraphEdge[],
  nodeIds: Set<string>,
): import("../../types/api.types.js").SoftwareGraphEdge[] {
  return edges.filter((edge) => nodeIds.has(edge.sourceId) && nodeIds.has(edge.targetId));
}
