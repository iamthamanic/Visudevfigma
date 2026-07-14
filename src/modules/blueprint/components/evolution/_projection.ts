/**
 * Projects SoftwareGraph nodes with evolution diff highlighting for EvolutionView.
 */

import type { GraphCanvasEdge, GraphCanvasNode, SoftwareGraph } from "../../types";
import type { SoftwareGraphDiffMetadata } from "../../types";
import { EVOLUTION_CHANGE_COLORS, resolveNodeChange, type EvolutionNodeChange } from "./_diff.js";

export interface EvolutionProjection {
  nodes: GraphCanvasNode[];
  edges: GraphCanvasEdge[];
  diff: SoftwareGraphDiffMetadata;
}

const MAX_EVOLUTION_LABEL_LEN = 48;

function truncateLabel(label: string): string {
  const trimmed = label.trim();
  if (trimmed.length <= MAX_EVOLUTION_LABEL_LEN) return trimmed;
  return `${trimmed.slice(0, MAX_EVOLUTION_LABEL_LEN - 1)}…`;
}

function visibleNodeIds(diff: SoftwareGraphDiffMetadata): Set<string> {
  return new Set([...diff.addedNodeIds, ...diff.removedNodeIds, ...diff.changedNodeIds]);
}

function toCanvasNode(
  node: SoftwareGraph["nodes"][number],
  change: EvolutionNodeChange,
): GraphCanvasNode {
  return {
    id: node.id,
    label: truncateLabel(node.label),
    kind: node.kind,
    color: EVOLUTION_CHANGE_COLORS[change],
  };
}

function toFallbackCanvasNode(nodeId: string, change: EvolutionNodeChange): GraphCanvasNode {
  return {
    id: nodeId,
    label: truncateLabel(nodeId),
    kind: "file",
    color: EVOLUTION_CHANGE_COLORS[change],
  };
}

export function projectEvolutionGraph(
  graph: SoftwareGraph,
  diff: SoftwareGraphDiffMetadata,
): EvolutionProjection {
  const highlightedIds = visibleNodeIds(diff);
  const nodeById = new Map(graph.nodes.map((node) => [node.id, node]));

  const nodes: GraphCanvasNode[] = [];
  for (const nodeId of highlightedIds) {
    const node = nodeById.get(nodeId);
    const change = resolveNodeChange(nodeId, diff);
    if (node) {
      nodes.push(toCanvasNode(node, change));
      continue;
    }
    if (change === "added" || change === "removed") {
      nodes.push(toFallbackCanvasNode(nodeId, change));
    }
  }

  const graphEdges = Array.isArray(graph.edges) ? graph.edges : [];
  const edges = graphEdges
    .filter((edge) => highlightedIds.has(edge.sourceId) && highlightedIds.has(edge.targetId))
    .map(
      (edge): GraphCanvasEdge => ({
        id: edge.id,
        source: edge.sourceId,
        target: edge.targetId,
        kind: edge.kind,
        label: edge.kind,
      }),
    );

  return { nodes, edges, diff };
}
