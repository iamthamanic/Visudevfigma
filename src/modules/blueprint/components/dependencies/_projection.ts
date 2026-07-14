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
  DEPENDENCY_EDGE_LABELS,
  RELATIONSHIP_LABELS,
  type DependencyEdgeKind,
} from "./_projection.constants.js";

export {
  DEFAULT_VISIBLE_DEPENDENCY_KINDS,
  DEPENDENCY_EDGE_KINDS,
  DEPENDENCY_EDGE_LABELS,
  RELATIONSHIP_LABELS,
  type DependencyEdgeKind,
} from "./_projection.constants.js";

const MAX_DEPENDENCY_LABEL_LEN = 48;

const NODE_KIND_LABELS: Partial<Record<SoftwareGraphNode["kind"], string>> = {
  file: "Datei",
  module: "Modul",
  service: "Service",
  route: "Route",
  domain: "Domain",
  symbol: "Symbol",
};

function formatNodeCardLabel(node: SoftwareGraphNode): string {
  const title = truncateLabel(node.label);
  const kindLabel = NODE_KIND_LABELS[node.kind] ?? node.kind;
  return `${title}\n${kindLabel}`;
}

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
    label: formatNodeCardLabel(node),
    kind: node.kind,
  };
}

function toCanvasEdge(edge: SoftwareGraphEdge): GraphCanvasEdge {
  const kind = edge.kind;
  const edgeLabel =
    kind in RELATIONSHIP_LABELS
      ? RELATIONSHIP_LABELS[kind as DependencyEdgeKind]
      : kind in DEPENDENCY_EDGE_LABELS
        ? DEPENDENCY_EDGE_LABELS[kind as DependencyEdgeKind]
        : kind;
  return {
    id: edge.id,
    source: edge.sourceId,
    target: edge.targetId,
    kind: edge.kind,
    label: edgeLabel,
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

export interface DependencyKindCount {
  kind: DependencyEdgeKind;
  count: number;
}

export function countDependencyEdgesByKind(graph: SoftwareGraph): DependencyKindCount[] {
  const graphEdges = Array.isArray(graph.edges) ? graph.edges : [];
  const counts = new Map<DependencyEdgeKind, number>();

  for (const kind of DEPENDENCY_EDGE_KINDS) {
    counts.set(kind, 0);
  }

  for (const edge of graphEdges) {
    if (isDependencyEdgeKind(edge.kind)) {
      counts.set(edge.kind, (counts.get(edge.kind) ?? 0) + 1);
    }
  }

  return DEPENDENCY_EDGE_KINDS.map((kind) => ({
    kind,
    count: counts.get(kind) ?? 0,
  })).filter(({ count }) => count > 0);
}

export function filterDependenciesProjection(
  projection: DependenciesProjection,
  searchQuery: string,
  graph: SoftwareGraph,
): DependenciesProjection {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return projection;

  const rawLabelById = new Map(graph.nodes.map((node) => [node.id, node.label]));

  const matchingNodeIds = new Set(
    projection.nodes
      .filter((node) => {
        const rawLabel = rawLabelById.get(node.id) ?? node.label;
        return rawLabel.toLowerCase().includes(query) || node.id.toLowerCase().includes(query);
      })
      .map((node) => node.id),
  );

  if (matchingNodeIds.size === 0) {
    return { nodes: [], edges: [] };
  }

  const edges = projection.edges.filter(
    (edge) => matchingNodeIds.has(edge.source) || matchingNodeIds.has(edge.target),
  );
  const visibleNodeIds = new Set(matchingNodeIds);
  for (const edge of edges) {
    visibleNodeIds.add(edge.source);
    visibleNodeIds.add(edge.target);
  }

  return {
    nodes: projection.nodes.filter((node) => visibleNodeIds.has(node.id)),
    edges,
  };
}
