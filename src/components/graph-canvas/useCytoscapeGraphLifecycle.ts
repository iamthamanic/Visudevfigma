import type { ValidatedGraphCanvasInput } from "./_validate.js";
import { useCytoscapeGraphMount } from "./useCytoscapeGraphMount.js";
import { useGraphCanvasEdgeSelection } from "./useGraphCanvasEdgeSelection.js";
import { useCytoscapeGraphSync } from "./useCytoscapeGraphSync.js";
import type { LayoutPreset } from "./_layout.js";

export function useCytoscapeGraphLifecycle(
  validated: ValidatedGraphCanvasInput,
  layoutPreset: LayoutPreset = "default",
  onEdgeSelect?: (edgeId: string | null) => void,
) {
  const { setContainerRef, hasGraph, initError, graphRef } = useCytoscapeGraphMount(
    validated,
    layoutPreset,
  );
  useCytoscapeGraphSync(graphRef, validated, hasGraph, layoutPreset);
  useGraphCanvasEdgeSelection(graphRef, hasGraph, onEdgeSelect);
  return { setContainerRef, hasGraph, initError, graphRef };
}
