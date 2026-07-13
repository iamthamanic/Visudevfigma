import type { ValidatedGraphCanvasInput } from "./_validate.js";
import { useCytoscapeGraphMount } from "./useCytoscapeGraphMount.js";
import { useCytoscapeGraphSync } from "./useCytoscapeGraphSync.js";
import type { LayoutPreset } from "./_layout.js";

export function useCytoscapeGraphLifecycle(
  validated: ValidatedGraphCanvasInput,
  layoutPreset: LayoutPreset = "default",
) {
  const { setContainerRef, hasGraph, initError, graphRef } = useCytoscapeGraphMount(
    validated,
    layoutPreset,
  );
  useCytoscapeGraphSync(graphRef, validated, hasGraph, layoutPreset);
  return { setContainerRef, hasGraph, initError, graphRef };
}
