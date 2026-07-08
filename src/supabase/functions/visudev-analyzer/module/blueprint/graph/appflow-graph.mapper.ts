/** Maps AppFlow AnalysisGraph into a VisuDevGraph subset for portfolio views. */

import type {
  AnalysisEdge,
  AnalysisEvidence,
  AnalysisGraph,
  AnalysisNode,
  AnalysisStatus,
} from "../../dto/analysis/analysis-graph.dto.ts";
import type {
  DetectionState,
  VisuDevEdge,
  VisuDevEvidence,
  VisuDevGraph,
  VisuDevNode,
  VisuDevScope,
} from "../../dto/graph/visudev-graph.dto.ts";

const NAVIGATION_EDGE_TYPES = new Set<AnalysisEdge["type"]>([
  "navigate",
  "open-modal",
  "switch-tab",
  "dropdown-action",
]);

export function mapAnalysisGraphToVisuDevGraph(
  analysis: AnalysisGraph,
): VisuDevGraph {
  const nodes: VisuDevNode[] = [];
  const edges: VisuDevEdge[] = [];
  const evidence: VisuDevEvidence[] = [];
  const scopes: VisuDevScope[] = [];
  const nodeIdByAnalysisId = new Map<string, string>();
  const scopeByNodeId = new Map<string, VisuDevScope>();

  for (const analysisNode of analysis.nodes) {
    const mappedNode = mapAnalysisNode(analysisNode);
    if (!mappedNode) continue;
    nodes.push(mappedNode);
    nodeIdByAnalysisId.set(analysisNode.id, mappedNode.id);

    if (mappedNode.kind === "route") {
      const scope: VisuDevScope = {
        id: `appflow:${analysisNode.id}`,
        kind: "route",
        label: mappedNode.label,
        nodeIds: [mappedNode.id],
        edgeIds: [],
        metadata: {
          source: "appflow",
          analysisNodeId: analysisNode.id,
          subtype: analysisNode.subtype,
        },
      };
      scopes.push(scope);
      scopeByNodeId.set(mappedNode.id, scope);
    }
  }

  const analysisNodeById = new Map(
    analysis.nodes.map((node) => [node.id, node]),
  );

  for (const analysisEdge of analysis.edges) {
    if (NAVIGATION_EDGE_TYPES.has(analysisEdge.type)) continue;
    const mappedEdge = mapAnalysisEdge(
      analysisEdge,
      nodeIdByAnalysisId,
      analysisNodeById,
    );
    if (!mappedEdge) continue;
    edges.push(mappedEdge);
    attachEdgeToScope(mappedEdge, scopeByNodeId);
  }

  for (const analysisEvidence of analysis.evidence) {
    const mappedEvidence = mapAnalysisEvidence(
      analysisEvidence,
      nodeIdByAnalysisId,
    );
    if (mappedEvidence) evidence.push(mappedEvidence);
  }

  return {
    version: 1,
    nodes,
    edges,
    evidence,
    scopes,
  };
}

function mapAnalysisNode(node: AnalysisNode): VisuDevNode | null {
  switch (node.kind) {
    case "route":
      return {
        id: toVisuDevId("node", node.id),
        kind: "route",
        label: node.path?.trim() || node.name,
        state: mapAnalysisStatus(node.status),
        scopeId: `appflow:${node.id}`,
        filePath: node.filePath,
        evidenceIds: [...node.evidenceIds],
        metadata: {
          source: "appflow",
          subtype: node.subtype,
          origin: node.origin,
        },
      };
    case "data":
      return {
        id: toVisuDevId("node", node.id),
        kind: "table",
        label: node.name,
        state: mapAnalysisStatus(node.status),
        filePath: node.filePath,
        evidenceIds: [...node.evidenceIds],
        metadata: { source: "appflow", origin: node.origin },
      };
    case "external":
      return {
        id: toVisuDevId("node", node.id),
        kind: "external_api",
        label: node.name,
        state: mapAnalysisStatus(node.status),
        filePath: node.filePath,
        evidenceIds: [...node.evidenceIds],
        metadata: { source: "appflow", origin: node.origin },
      };
    default:
      return null;
  }
}

function mapAnalysisEdge(
  edge: AnalysisEdge,
  nodeIdByAnalysisId: Map<string, string>,
  analysisNodeById: Map<string, AnalysisNode>,
): VisuDevEdge | null {
  const fromNodeId = nodeIdByAnalysisId.get(edge.fromNodeId);
  const toAnalysisNode = analysisNodeById.get(edge.toNodeId);
  const toNodeId = nodeIdByAnalysisId.get(edge.toNodeId);
  if (!fromNodeId || !toNodeId || !toAnalysisNode) return null;

  const edgeKind = mapAnalysisEdgeKind(edge.type, toAnalysisNode.kind);
  if (!edgeKind) return null;

  return {
    id: toVisuDevId("edge", edge.id),
    fromNodeId,
    toNodeId,
    kind: edgeKind,
    state: mapAnalysisStatus(edge.status),
    scopeId: scopeIdForRouteNode(fromNodeId, nodeIdByAnalysisId),
    evidenceIds: [...edge.evidenceIds],
    metadata: {
      source: "appflow",
      analysisEdgeType: edge.type,
      origin: edge.origin,
    },
  };
}

function mapAnalysisEdgeKind(
  edgeType: AnalysisEdge["type"],
  targetKind: AnalysisNode["kind"],
): VisuDevEdge["kind"] | null {
  if (edgeType === "api-call" && targetKind === "external") return "calls";
  if (edgeType === "db-query" && targetKind === "data") return "reads";
  return null;
}

function mapAnalysisEvidence(
  item: AnalysisEvidence,
  nodeIdByAnalysisId: Map<string, string>,
): VisuDevEvidence | null {
  const subjectId = item.subjectType === "node"
    ? nodeIdByAnalysisId.get(item.subjectId) ?? item.subjectId
    : item.subjectId;

  return {
    id: toVisuDevId("evidence", item.id),
    factId: item.id,
    subjectType: item.subjectType,
    subjectId,
    filePath: item.filePath?.trim() || "unknown",
    line: item.line && item.line > 0 ? item.line : 1,
    snippet: item.selector?.trim() || item.route?.trim() || "",
    summary: item.summary,
  };
}

function attachEdgeToScope(
  edge: VisuDevEdge,
  scopeByNodeId: Map<string, VisuDevScope>,
): void {
  const scope = scopeByNodeId.get(edge.fromNodeId);
  if (!scope) return;
  if (!scope.edgeIds.includes(edge.id)) {
    scope.edgeIds.push(edge.id);
  }
  if (!scope.nodeIds.includes(edge.toNodeId)) {
    scope.nodeIds.push(edge.toNodeId);
  }
}

function scopeIdForRouteNode(
  fromNodeId: string,
  nodeIdByAnalysisId: Map<string, string>,
): string | undefined {
  for (const [analysisId, visuDevId] of nodeIdByAnalysisId.entries()) {
    if (visuDevId === fromNodeId) return `appflow:${analysisId}`;
  }
  return undefined;
}

function mapAnalysisStatus(status: AnalysisStatus): DetectionState {
  if (status === "confirmed" || status === "verified") return "confirmed";
  if (status === "deprecated") return "missing";
  return "unknown";
}

function toVisuDevId(prefix: string, rawId: string): string {
  const sanitized = rawId.replace(/[^a-zA-Z0-9:_-]/g, "-");
  return `${prefix}-appflow-${sanitized}`.slice(0, 80);
}
