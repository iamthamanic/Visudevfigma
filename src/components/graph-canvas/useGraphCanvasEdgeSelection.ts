import { useEffect, type RefObject } from "react";
import type cytoscape from "cytoscape";

export function useGraphCanvasEdgeSelection(
  graphRef: RefObject<cytoscape.Core | null>,
  hasGraph: boolean,
  onEdgeSelect?: (edgeId: string | null) => void,
) {
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || !hasGraph || !onEdgeSelect) return;

    const handleTap = (event: cytoscape.EventObject) => {
      const target = event.target;
      if (target.isEdge()) {
        onEdgeSelect(target.id());
        return;
      }
      if (target === graph) {
        onEdgeSelect(null);
      }
    };

    graph.on("tap", handleTap);
    return () => {
      graph.removeListener("tap", handleTap);
    };
  }, [graphRef, hasGraph, onEdgeSelect]);
}
