/**
 * Graph layout: dagre for moderate graphs, grid for large graphs (avoids empty preset overlap).
 * fit=false on sync avoids jarring viewport jumps when only labels change.
 */

import type cytoscape from "cytoscape";

export const MAX_DAGRE_NODES = 300;

export type LayoutPreset = "default" | "hierarchical";

export function buildLayoutOptions(
  nodeCount: number,
  fit = true,
  preset: LayoutPreset = "default",
): cytoscape.LayoutOptions {
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
  if (preset === "hierarchical") {
    return {
      name: "dagre",
      padding: 24,
      animate: false,
      fit,
      rankDir: "TB",
      nodeSep: 40,
      rankSep: 60,
    } as cytoscape.LayoutOptions;
  }
  return { name: "dagre", padding: 24, animate: false, fit } as cytoscape.LayoutOptions;
}

export function runGraphLayout(
  cy: cytoscape.Core,
  fit = true,
  preset: LayoutPreset = "default",
): void {
  cy.layout(buildLayoutOptions(cy.nodes().length, fit, preset)).run();
}
