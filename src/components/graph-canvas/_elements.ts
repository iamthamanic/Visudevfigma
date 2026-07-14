import type { GraphCanvasEdge, GraphCanvasNode } from "./types.js";

export interface CytoscapeElement {
  data: Record<string, unknown>;
}

export function buildElements(
  nodes: GraphCanvasNode[],
  edges: GraphCanvasEdge[],
): CytoscapeElement[] {
  const nodeIds = new Set(nodes.map((node) => node.id));
  const validEdges = edges.filter((edge) => nodeIds.has(edge.source) && nodeIds.has(edge.target));

  return [
    ...nodes.map((node) => ({
      data: { id: node.id, label: node.label, kind: node.kind, color: node.color },
    })),
    ...validEdges.map((edge) => ({
      data: {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        kind: edge.kind,
        label: edge.label ?? edge.kind,
      },
    })),
  ];
}
