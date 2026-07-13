import type cytoscape from "cytoscape";
import type { GraphCanvasEdge, GraphCanvasNode } from "./types.js";
import { syncGraphElements } from "./_sync.js";

export interface MountedCytoscapeGraph {
  graph: cytoscape.Core;
  cleanup: () => void;
}

export async function mountCytoscapeGraph(
  container: HTMLDivElement,
  nodes: GraphCanvasNode[],
  edges: GraphCanvasEdge[],
  isStale: () => boolean = () => false,
): Promise<MountedCytoscapeGraph | null> {
  let graph: cytoscape.Core | null = null;

  try {
    const { createCytoscapeInstance } = await import("./_lifecycle.js");
    if (isStale()) return null;

    graph = await createCytoscapeInstance(container, nodes, edges);
    if (isStale()) {
      graph.destroy();
      return null;
    }

    syncGraphElements(graph, nodes, edges);

    const mountedGraph = graph;
    return {
      graph: mountedGraph,
      cleanup: () => {
        mountedGraph.destroy();
      },
    };
  } catch (error) {
    graph?.destroy();
    throw error;
  }
}
