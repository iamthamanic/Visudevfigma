import type { GraphCanvasNode } from "../../types";
import { getArchitectureKindColor } from "./_colors.js";

export function applyArchitectureNodeColors(nodes: GraphCanvasNode[]): GraphCanvasNode[] {
  return nodes.map((node) => ({
    ...node,
    color: getArchitectureKindColor(node.kind),
  }));
}
