import type { GraphCanvasEdge, GraphCanvasNode } from "./types.js";
import { MAX_DAGRE_NODES } from "./_layout.js";

const MAX_NODES = 2_500;
const MAX_EDGES = 5_000;
const MAX_STRING_LEN = 256;
const MAX_LABEL_LEN = 96;

function exactId(value: unknown, max = MAX_STRING_LEN): string | undefined {
  if (typeof value !== "string" || value.length === 0 || value.length > max) return undefined;
  return value;
}

function boundedString(value: unknown, max = MAX_STRING_LEN): string | undefined {
  if (typeof value !== "string" || value.length === 0) return undefined;
  return value.length > max ? value.slice(0, max) : value;
}

function isSafeCssColor(value: string): boolean {
  return (
    /^#[0-9a-fA-F]{3,8}$/.test(value) ||
    /^var\(--[a-zA-Z0-9-_]+\)$/.test(value) ||
    /^rgb\(\d{1,3},\s*\d{1,3},\s*\d{1,3}\)$/.test(value)
  );
}

function safeNodeColor(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const color = boundedString(value, 64);
  if (!color || !isSafeCssColor(color)) return undefined;
  return color;
}

export interface ValidatedGraphCanvasInput {
  nodes: GraphCanvasNode[];
  edges: GraphCanvasEdge[];
  hasRenderableNodes: boolean;
  isLargeGraph: boolean;
}

export function validateGraphCanvasInput(
  nodes: GraphCanvasNode[],
  edges: GraphCanvasEdge[],
): ValidatedGraphCanvasInput {
  const inputNodes = Array.isArray(nodes) ? nodes : [];
  const inputEdges = Array.isArray(edges) ? edges : [];
  const safeNodes: GraphCanvasNode[] = [];
  const seenNodeIds = new Set<string>();
  const reservedIds = new Set<string>();

  for (const node of inputNodes.slice(0, MAX_NODES)) {
    const id = exactId(node?.id);
    const label = boundedString(node?.label, MAX_LABEL_LEN);
    const kind = boundedString(node?.kind, 64);
    if (!id || !label || !kind || seenNodeIds.has(id)) continue;
    seenNodeIds.add(id);
    reservedIds.add(id);
    safeNodes.push({
      id,
      label,
      kind,
      color: safeNodeColor(node.color),
    });
  }

  const nodeIds = new Set(safeNodes.map((node) => node.id));
  const safeEdges: GraphCanvasEdge[] = [];
  const seenEdgeIds = new Set<string>();

  for (const edge of inputEdges.slice(0, MAX_EDGES)) {
    const id = exactId(edge?.id);
    const source = exactId(edge?.source);
    const target = exactId(edge?.target);
    const kind = boundedString(edge?.kind, 64);
    if (!id || !source || !target || !kind) continue;
    if (!nodeIds.has(source) || !nodeIds.has(target)) continue;
    if (reservedIds.has(id) || seenEdgeIds.has(id)) continue;
    seenEdgeIds.add(id);
    reservedIds.add(id);
    safeEdges.push({
      id,
      source,
      target,
      kind,
      label: edge.label ? boundedString(edge.label, MAX_LABEL_LEN) : undefined,
    });
  }

  return {
    nodes: safeNodes,
    edges: safeEdges,
    hasRenderableNodes: safeNodes.length > 0,
    isLargeGraph: safeNodes.length > MAX_DAGRE_NODES,
  };
}
