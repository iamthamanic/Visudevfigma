import type { ValidatedGraphCanvasInput } from "./_validate.js";
import { useCytoscapeGraphMount } from "./useCytoscapeGraphMount.js";
import { useCytoscapeGraphSync } from "./useCytoscapeGraphSync.js";

export function useCytoscapeGraphLifecycle(validated: ValidatedGraphCanvasInput) {
  const { setContainerRef, hasGraph, initError, graphRef } = useCytoscapeGraphMount(validated);
  useCytoscapeGraphSync(graphRef, validated, hasGraph);
  return { setContainerRef, hasGraph, initError, graphRef };
}
