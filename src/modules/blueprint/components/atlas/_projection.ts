/**
 * Maps SoftwareGraph into a condensed Atlas overview for birds-eye exploration.
 */

import { getNodeKindColor } from "../infrastructure/_colors.js";
import type {
  GraphCanvasEdge,
  GraphCanvasNode,
  SoftwareGraph,
  SoftwareGraphEdge,
  SoftwareGraphNode,
} from "../../types";
import {
  ATLAS_MAX_EDGES,
  ATLAS_MAX_LABEL_LEN,
  ATLAS_OVERVIEW_KINDS,
  ATLAS_SEARCH_MATCH_LIMIT,
  ATLAS_SOFT_LIMIT,
} from "./_projection.constants.js";

export interface AtlasProjectionOptions {
  searchQuery?: string;
}

export interface AtlasProjection {
  nodes: GraphCanvasNode[];
  edges: GraphCanvasEdge[];
  condensed: boolean;
  totalNodes: number;
  visibleNodes: number;
}

function truncateLabel(label: string): string {
  const trimmed = label.trim();
  if (trimmed.length <= ATLAS_MAX_LABEL_LEN) return trimmed;
  return `${trimmed.slice(0, ATLAS_MAX_LABEL_LEN - 1)}…`;
}

function toAtlasCanvasNode(node: SoftwareGraphNode): GraphCanvasNode {
  return {
    id: node.id,
    label: truncateLabel(node.label),
    kind: node.kind,
    color: getNodeKindColor(node.kind),
  };
}

function toAtlasCanvasEdge(edge: SoftwareGraphEdge): GraphCanvasEdge {
  return {
    id: edge.id,
    source: edge.sourceId,
    target: edge.targetId,
    kind: edge.kind,
    label: edge.kind,
  };
}

function selectAtlasNodes(
  graphNodes: SoftwareGraphNode[],
  searchQuery: string,
): { nodes: SoftwareGraphNode[]; condensed: boolean } {
  const normalizedSearch = searchQuery.trim().toLowerCase();
  let condensed = graphNodes.length > ATLAS_SOFT_LIMIT;

  if (normalizedSearch) {
    const matches = graphNodes.filter((node) =>
      node.label.toLowerCase().includes(normalizedSearch),
    );
    condensed = condensed || matches.length > ATLAS_SEARCH_MATCH_LIMIT;
    return {
      nodes: matches.slice(0, ATLAS_SEARCH_MATCH_LIMIT),
      condensed,
    };
  }

  if (graphNodes.length <= ATLAS_SOFT_LIMIT) {
    return { nodes: graphNodes, condensed: false };
  }

  const overviewNodes = graphNodes.filter((node) => ATLAS_OVERVIEW_KINDS.has(node.kind));
  const selected = overviewNodes.length > 0 ? overviewNodes : graphNodes;
  const capped = selected.slice(0, ATLAS_SOFT_LIMIT);
  return { nodes: capped, condensed: true };
}

export function projectAtlasGraph(
  graph: SoftwareGraph,
  options: AtlasProjectionOptions = {},
): AtlasProjection {
  const graphNodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const graphEdges = Array.isArray(graph.edges) ? graph.edges : [];
  const { nodes: selectedNodes, condensed: selectionCondensed } = selectAtlasNodes(
    graphNodes,
    options.searchQuery ?? "",
  );

  const visibleIds = new Set(selectedNodes.map((node) => node.id));
  const edges = graphEdges
    .filter((edge) => visibleIds.has(edge.sourceId) && visibleIds.has(edge.targetId))
    .slice(0, ATLAS_MAX_EDGES)
    .map(toAtlasCanvasEdge);

  return {
    nodes: selectedNodes.map(toAtlasCanvasNode),
    edges,
    condensed: graph.condensed || selectionCondensed || edges.length >= ATLAS_MAX_EDGES,
    totalNodes: graphNodes.length,
    visibleNodes: selectedNodes.length,
  };
}
