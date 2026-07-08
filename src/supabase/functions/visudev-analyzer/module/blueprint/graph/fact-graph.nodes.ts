/** Node/edge helpers for VisuDevGraph fact mapping. */

import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import type {
  DetectionState,
  VisuDevEdge,
  VisuDevEdgeKind,
  VisuDevNode,
  VisuDevNodeKind,
} from "../../dto/graph/visudev-graph.dto.ts";
import type { RouteScope } from "../../dto/blueprint/route-scope.dto.ts";
import { validateExternalFact } from "./fact-graph.validate.ts";

export function attachEvidence(
  subject: VisuDevNode | VisuDevEdge | undefined,
  evidenceId: string,
): void {
  if (!subject) {
    throw new Error(`VisuDevGraph subject missing for evidence ${evidenceId}`);
  }
  if (!subject.evidenceIds.includes(evidenceId)) {
    subject.evidenceIds.push(evidenceId);
  }
}

export function ensureRouteNode(
  nodes: VisuDevNode[],
  nodeById: Map<string, VisuDevNode>,
  route: RouteScope,
  nodeId: string,
): void {
  if (nodeById.has(nodeId)) return;
  const node: VisuDevNode = {
    id: nodeId,
    kind: "route",
    label: `${route.method} ${route.path}`,
    state: "confirmed",
    scopeId: route.id,
    filePath: route.filePath,
    line: route.line,
    metadata: { method: route.method, path: route.path },
    evidenceIds: [],
  };
  nodes.push(node);
  nodeById.set(nodeId, node);
}

export function ensureTableNode(
  nodes: VisuDevNode[],
  nodeById: Map<string, VisuDevNode>,
  table: string,
  nodeId: string,
  _scopeId: string,
  fact: CodeFact,
): void {
  if (nodeById.has(nodeId)) return;
  const node: VisuDevNode = {
    id: nodeId,
    kind: "table",
    label: table,
    state: "confirmed",
    filePath: fact.filePath,
    line: fact.line,
    metadata: { table, operation: fact.metadata.operation },
    evidenceIds: [],
  };
  nodes.push(node);
  nodeById.set(nodeId, node);
}

export function ensureExternalNode(
  nodes: VisuDevNode[],
  nodeById: Map<string, VisuDevNode>,
  nodeId: string,
  scopeId: string,
  fact: CodeFact,
): void {
  if (nodeById.has(nodeId)) return;
  const node: VisuDevNode = {
    id: nodeId,
    kind: "external_api",
    label: validateExternalFact(fact),
    state: "confirmed",
    scopeId,
    filePath: fact.filePath,
    line: fact.line,
    evidenceIds: [],
  };
  nodes.push(node);
  nodeById.set(nodeId, node);
}

export function ensureControlNode(
  nodes: VisuDevNode[],
  nodeById: Map<string, VisuDevNode>,
  nodeId: string,
  kind: VisuDevNodeKind,
  label: string,
  scopeId: string,
  filePath?: string,
  line?: number,
  state: DetectionState = "missing",
): void {
  if (nodeById.has(nodeId)) return;
  const node: VisuDevNode = {
    id: nodeId,
    kind,
    label,
    state,
    scopeId,
    filePath,
    line,
    evidenceIds: [],
  };
  nodes.push(node);
  nodeById.set(nodeId, node);
}

export function ensureEdge(
  edges: VisuDevEdge[],
  edgeById: Map<string, VisuDevEdge>,
  edgeId: string,
  fromNodeId: string,
  toNodeId: string,
  kind: VisuDevEdgeKind,
  scopeId: string,
  fact: CodeFact,
  evidenceId: string,
): VisuDevEdge {
  const existing = edgeById.get(edgeId);
  if (existing) {
    attachEvidence(existing, evidenceId);
    return existing;
  }
  const edge: VisuDevEdge = {
    id: edgeId,
    fromNodeId,
    toNodeId,
    kind,
    state: "confirmed",
    scopeId,
    evidenceIds: [evidenceId],
    metadata: { factKind: fact.kind },
  };
  edges.push(edge);
  edgeById.set(edgeId, edge);
  return edge;
}
