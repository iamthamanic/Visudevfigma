import type { RefObject } from "react";
import { useCallback } from "react";
import type cytoscape from "cytoscape";

export function useGraphCanvasToolbar(graphRef: RefObject<cytoscape.Core | null>) {
  const handleFit = useCallback(() => {
    graphRef.current?.fit(undefined, 32);
  }, [graphRef]);

  const handleZoomIn = useCallback(() => {
    graphRef.current?.zoom(graphRef.current.zoom() * 1.2);
  }, [graphRef]);

  const handleZoomOut = useCallback(() => {
    graphRef.current?.zoom(graphRef.current.zoom() / 1.2);
  }, [graphRef]);

  return { handleFit, handleZoomIn, handleZoomOut };
}
