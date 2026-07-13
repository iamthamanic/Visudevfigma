import type { MutableRefObject } from "react";
import type cytoscape from "cytoscape";

/** Always destroy Cytoscape core + mount cleanup to prevent listener/DOM leaks. */
export function releaseCytoscapeMount(
  graphRef: MutableRefObject<cytoscape.Core | null>,
  disposeMount: (() => void) | null,
): void {
  disposeMount?.();
  if (graphRef.current) {
    graphRef.current.destroy();
    graphRef.current = null;
  }
}
