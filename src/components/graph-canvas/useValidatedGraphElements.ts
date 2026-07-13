import { useMemo } from "react";
import type { GraphCanvasEdge, GraphCanvasNode } from "./types.js";
import { validateGraphCanvasInput } from "./_validate.js";

export function useValidatedGraphElements(nodes: GraphCanvasNode[], edges: GraphCanvasEdge[]) {
  return useMemo(() => validateGraphCanvasInput(nodes, edges), [nodes, edges]);
}
