/**
 * Applies Cytoscape `selected` class when GraphCanvas receives selectedNodeId.
 */

import { useEffect, type RefObject } from "react";
import type cytoscape from "cytoscape";

export function useGraphCanvasNodeHighlight(
  graphRef: RefObject<cytoscape.Core | null>,
  hasGraph: boolean,
  selectedNodeId: string | null | undefined,
  validNodeIds: Set<string>,
): void {
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || !hasGraph) return;

    graph.nodes().removeClass("selected");

    if (selectedNodeId && validNodeIds.has(selectedNodeId)) {
      const node = graph.getElementById(selectedNodeId);
      if (node.nonempty()) {
        node.addClass("selected");
      }
    }
  }, [graphRef, hasGraph, selectedNodeId, validNodeIds]);
}
