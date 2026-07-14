/**
 * Maps SoftwareGraph dependency edges (imports, calls, api, event, data)
 * into DependenciesView canvas nodes and edges.
 */

import type {
  GraphCanvasEdge,
  GraphCanvasNode,
  SoftwareGraph,
  SoftwareGraphEdge,
  SoftwareGraphEdgeKind,
  SoftwareGraphNode,
} from "../../types";
import {
  DEFAULT_VISIBLE_DEPENDENCY_KINDS,
  DEPENDENCY_EDGE_KINDS,
  type DependencyEdgeKind,
} from "./_projection.constants.js";

export {
  DEFAULT_VISIBLE_DEPENDENCY_KINDS,
  DEPENDENCY_EDGE_KINDS,
  DEPENDENCY_EDGE_LABELS,
  type DependencyEdgeKind,
} from "./_projection.constants.js";

const MAX_DEPENDENCY_LABEL_LEN = 48;

export interface DependenciesProjectionOptions {
  visibleEdgeKinds?: Set<SoftwareGraphEdgeKind>;
}

export interface DependenciesProjection {
  nodes: GraphCanvasNode[];
  edges: GraphCanvasEdge[];
}

function isDependencyEdgeKind(kind: string): kind is DependencyEdgeKind {
  return (DEPENDENCY_EDGE_KINDS as readonly string[]).includes(kind);
}

function truncateLabel(label: string): string {
  const trimmed = label.trim();
  if (trimmed.length <= MAX_DEPENDENCY_LABEL_LEN) return trimmed;
  return `${trimmed.slice(0, MAX_DEPENDENCY_LABEL_LEN - 1)}…`;
}

function toCanvasNode(node: SoftwareGraphNode): GraphCanvasNode {
  return {
    id: node.id,
    label: truncateLabel(node.label),
    kind: node.kind,
  };
}

function toCanvasEdge(edge: SoftwareGraphEdge): GraphCanvasEdge {
  return {
    id: edge.id,
    source: edge.sourceId,
    target: edge.targetId,
    kind: edge.kind,
    label: edge.kind,
  };
}

function resolveVisibleEdgeKinds(
  visibleEdgeKinds: Set<SoftwareGraphEdgeKind> | undefined,
): Set<DependencyEdgeKind> {
  if (visibleEdgeKinds === undefined) {
    return new Set(DEFAULT_VISIBLE_DEPENDENCY_KINDS);
  }
  const resolved = new Set<DependencyEdgeKind>();
  for (const kind of visibleEdgeKinds) {
    if (isDependencyEdgeKind(kind)) resolved.add(kind);
  }
  return resolved;
}

export function projectDependenciesGraph(
  graph: SoftwareGraph,
  options: DependenciesProjectionOptions = {},
): DependenciesProjection {
  const graphNodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const graphEdges = Array.isArray(graph.edges) ? graph.edges : [];
  const nodeById = new Map(graphNodes.map((node) => [node.id, node]));
  const visibleKinds = resolveVisibleEdgeKinds(options.visibleEdgeKinds);

  const dependencyEdges = graphEdges.filter(
    (edge) => isDependencyEdgeKind(edge.kind) && visibleKinds.has(edge.kind),
  );

  const visibleNodeIds = new Set<string>();
  for (const edge of dependencyEdges) {
    if (nodeById.has(edge.sourceId)) visibleNodeIds.add(edge.sourceId);
    if (nodeById.has(edge.targetId)) visibleNodeIds.add(edge.targetId);
  }

  const nodes: GraphCanvasNode[] = [];
  for (const nodeId of visibleNodeIds) {
    const node = nodeById.get(nodeId);
    if (node) nodes.push(toCanvasNode(node));
  }

  const edges = dependencyEdges
    .filter((edge) => visibleNodeIds.has(edge.sourceId) && visibleNodeIds.has(edge.targetId))
    .map(toCanvasEdge);

  return { nodes, edges };
}

export function findEdgeEvidence(
  graph: SoftwareGraph,
  edgeId: string | null,
): { edge: SoftwareGraphEdge; evidence: SoftwareGraph["evidence"] } | null {
  if (!edgeId) return null;
  const graphEdges = Array.isArray(graph.edges) ? graph.edges : [];
  const edge = graphEdges.find((candidate) => candidate.id === edgeId);
  if (!edge) return null;

  const factId = edge.metadata?.evidenceFactId;
  const graphEvidence = Array.isArray(graph.evidence) ? graph.evidence : [];
  const linkedEvidence = graphEvidence.filter(
    (item) => item.edgeId === edgeId || (typeof factId === "string" && item.factId === factId),
  );

  return { edge, evidence: linkedEvidence };
}
