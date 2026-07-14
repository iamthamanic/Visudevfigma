/**
 * Node tap and canvas deselection for GraphCanvas.
 */

import { useEffect, type RefObject } from "react";
import type cytoscape from "cytoscape";

export function useGraphCanvasNodeSelection(
  graphRef: RefObject<cytoscape.Core | null>,
  hasGraph: boolean,
  onNodeSelect?: (nodeId: string | null) => void,
) {
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || !hasGraph || !onNodeSelect) return;

    const handleTap = (event: cytoscape.EventObject) => {
      const target = event.target;
      if (target.isNode()) {
        onNodeSelect(target.id());
        return;
      }
      if (target === graph) {
        onNodeSelect(null);
      }
    };

    graph.on("tap", handleTap);
    return () => {
      graph.removeListener("tap", handleTap);
    };
  }, [graphRef, hasGraph, onNodeSelect]);
}
