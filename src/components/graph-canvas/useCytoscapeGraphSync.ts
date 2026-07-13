import { useEffect, type RefObject } from "react";
import type cytoscape from "cytoscape";
import { syncGraphElements } from "./_sync.js";
import type { ValidatedGraphCanvasInput } from "./_validate.js";

export function useCytoscapeGraphSync(
  graphRef: RefObject<cytoscape.Core | null>,
  validated: ValidatedGraphCanvasInput,
  hasGraph: boolean,
) {
  useEffect(() => {
    const graph = graphRef.current;
    if (!graph || !hasGraph) return;
    syncGraphElements(graph, validated.nodes, validated.edges);
  }, [graphRef, validated.nodes, validated.edges, hasGraph]);
}
