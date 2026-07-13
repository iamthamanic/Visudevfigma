/**
 * Graph layout: dagre for moderate graphs, grid for large graphs (avoids empty preset overlap).
 * fit=false on sync avoids jarring viewport jumps when only labels change.
 */

import type cytoscape from "cytoscape";

export const MAX_DAGRE_NODES = 300;

export function buildLayoutOptions(nodeCount: number, fit = true): cytoscape.LayoutOptions {
  const safeCount =
    typeof nodeCount === "number" && Number.isFinite(nodeCount) && nodeCount >= 0 ? nodeCount : 0;
  if (safeCount > MAX_DAGRE_NODES) {
    return {
      name: "grid",
      condense: true,
      padding: 24,
      animate: false,
      fit,
    } as cytoscape.LayoutOptions;
  }
  return { name: "dagre", padding: 24, animate: false, fit } as cytoscape.LayoutOptions;
}

export function runGraphLayout(cy: cytoscape.Core, fit = true): void {
  cy.layout(buildLayoutOptions(cy.nodes().length, fit)).run();
}
