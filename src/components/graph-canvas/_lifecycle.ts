/**
 * Lazy Cytoscape bootstrap: dagre registers once per module, not at import time.
 */

import type cytoscape from "cytoscape";
import type { GraphCanvasEdge, GraphCanvasNode } from "./types.js";
import { buildElements } from "./_elements.js";
import { buildLayoutOptions } from "./_layout.js";
import { buildStylesheet } from "./_styles.js";

type CytoscapeFactory = typeof cytoscape;

let cytoscapeLoader: Promise<CytoscapeFactory> | null = null;

async function loadCytoscape(): Promise<CytoscapeFactory> {
  if (!cytoscapeLoader) {
    cytoscapeLoader = (async () => {
      try {
        const [cytoscapeModule, dagreModule] = await Promise.all([
          import("cytoscape"),
          import("cytoscape-dagre"),
        ]);
        const factory = cytoscapeModule.default;
        factory.use(dagreModule.default);
        return factory;
      } catch (error) {
        cytoscapeLoader = null;
        throw error;
      }
    })();
  }
  return cytoscapeLoader;
}

export async function createCytoscapeInstance(
  container: HTMLDivElement,
  nodes: GraphCanvasNode[],
  edges: GraphCanvasEdge[],
): Promise<cytoscape.Core> {
  const cytoscape = await loadCytoscape();
  return cytoscape({
    container,
    elements: buildElements(nodes, edges),
    style: buildStylesheet(),
    layout: buildLayoutOptions(nodes.length, true),
    wheelSensitivity: 0.2,
    minZoom: 0.1,
    maxZoom: 3,
  });
}
