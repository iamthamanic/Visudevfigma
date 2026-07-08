/** Trims VisuDevGraph evidence and drops dangling references after export caps. */

import type {
  VisuDevEvidence,
  VisuDevGraph,
} from "../../dto/graph/visudev-graph.dto.ts";

export function trimGraphEvidence(
  graph: VisuDevGraph,
  maxEvidence: number,
): VisuDevGraph {
  const allowedEvidenceIds = new Set(
    graph.evidence.slice(0, maxEvidence).map((entry) => entry.id),
  );
  const evidence: VisuDevEvidence[] = graph.evidence.slice(0, maxEvidence);
  const nodes = graph.nodes
    .map((node) => ({
      ...node,
      evidenceIds: node.evidenceIds.filter((id) => allowedEvidenceIds.has(id)),
    }))
    .filter((node) => node.evidenceIds.length > 0 || node.kind === "route");
  const allowedNodeIds = new Set(nodes.map((node) => node.id));
  const edges = graph.edges
    .map((edge) => ({
      ...edge,
      evidenceIds: edge.evidenceIds.filter((id) => allowedEvidenceIds.has(id)),
    }))
    .filter((edge) =>
      edge.evidenceIds.length > 0 &&
      allowedNodeIds.has(edge.fromNodeId) &&
      allowedNodeIds.has(edge.toNodeId)
    );
  const allowedEdgeIds = new Set(edges.map((edge) => edge.id));
  const scopes = graph.scopes.map((scope) => ({
    ...scope,
    nodeIds: scope.nodeIds.filter((id) => allowedNodeIds.has(id)),
    edgeIds: scope.edgeIds.filter((id) => allowedEdgeIds.has(id)),
  }));
  return { ...graph, evidence, nodes, edges, scopes };
}
