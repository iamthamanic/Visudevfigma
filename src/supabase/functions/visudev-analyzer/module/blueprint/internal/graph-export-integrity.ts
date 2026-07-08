/** Repairs dangling graph references before strict export validation. */

import type { VisuDevGraph } from "../../dto/graph/visudev-graph.dto.ts";

export function repairGraphReferences(graph: VisuDevGraph): VisuDevGraph {
  const nodeIds = new Set(graph.nodes.map((node) => node.id));
  const evidenceIds = new Set(graph.evidence.map((item) => item.id));

  const nodes = graph.nodes.map((node) => ({
    ...node,
    evidenceIds: node.evidenceIds.filter((id) => evidenceIds.has(id)),
  }));

  const edges = graph.edges
    .filter((edge) =>
      nodeIds.has(edge.fromNodeId) && nodeIds.has(edge.toNodeId)
    )
    .map((edge) => ({
      ...edge,
      evidenceIds: edge.evidenceIds.filter((id) => evidenceIds.has(id)),
    }));
  const allowedEdgeIds = new Set(edges.map((edge) => edge.id));

  const evidence = graph.evidence.map((item) => {
    if (item.subjectType === "node" && !nodeIds.has(item.subjectId)) {
      return {
        ...item,
        subjectType: "scope" as const,
        subjectId: `orphan:${item.id}`,
      };
    }
    if (item.subjectType === "edge" && !allowedEdgeIds.has(item.subjectId)) {
      return {
        ...item,
        subjectType: "scope" as const,
        subjectId: `orphan:${item.id}`,
      };
    }
    if (item.subjectType === "scope") {
      const scopeExists = graph.scopes.some((scope) =>
        scope.id === item.subjectId
      );
      if (!scopeExists) {
        return {
          ...item,
          subjectId: `orphan:${item.id}`,
        };
      }
    }
    return item;
  });

  const scopes = graph.scopes.map((scope) => ({
    ...scope,
    nodeIds: scope.nodeIds.filter((id) => nodeIds.has(id)),
    edgeIds: scope.edgeIds.filter((id) => allowedEdgeIds.has(id)),
  }));

  return { ...graph, nodes, edges, evidence, scopes };
}
