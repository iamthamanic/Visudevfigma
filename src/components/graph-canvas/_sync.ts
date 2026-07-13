/**
 * Diff incoming GraphCanvas props against the live Cytoscape collection.
 * Uses element IDs (not just node endpoints) so removed edges disappear even when
 * their source/target nodes remain.
 */

import type cytoscape from "cytoscape";
import type { GraphCanvasEdge, GraphCanvasNode } from "./types.js";
import { buildElements } from "./_elements.js";
import { runGraphLayout } from "./_layout.js";

export function syncGraphElements(
  graph: cytoscape.Core,
  nodes: GraphCanvasNode[],
  edges: GraphCanvasEdge[],
): void {
  const nextElements = buildElements(nodes, edges);
  const nextById = new Map(nextElements.map((element) => [element.data.id as string, element]));
  const nextIds = new Set(nextById.keys());

  graph.batch(() => {
    graph.elements().forEach((element) => {
      if (!nextIds.has(element.id())) {
        graph.remove(element);
      }
    });

    for (const [elementId, elementDef] of nextById) {
      const existing = graph.getElementById(elementId);
      if (existing.empty()) {
        graph.add(elementDef);
        continue;
      }

      const nextData = elementDef.data as Record<string, unknown>;
      const isEdge = typeof nextData.source === "string" && typeof nextData.target === "string";
      if (
        isEdge &&
        (existing.data("source") !== nextData.source || existing.data("target") !== nextData.target)
      ) {
        graph.remove(existing);
        graph.add(elementDef);
        continue;
      }

      existing.data(elementDef.data);
    }
  });

  runGraphLayout(graph, false);
}
