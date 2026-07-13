/**
 * Regression tests for Cytoscape element diffing.
 */

import cytoscape from "cytoscape";
import dagre from "cytoscape-dagre";
import { describe, it, expect, afterEach } from "vitest";
import { syncGraphElements } from "./_sync.js";

cytoscape.use(dagre);

describe("syncGraphElements", () => {
  let graph: cytoscape.Core | null = null;

  afterEach(() => {
    graph?.destroy();
    graph = null;
  });

  it("removes edges that disappear from props while endpoints remain", () => {
    graph = cytoscape({ headless: true });
    syncGraphElements(
      graph,
      [
        { id: "a", label: "A", kind: "service" },
        { id: "b", label: "B", kind: "service" },
      ],
      [{ id: "e1", source: "a", target: "b", kind: "calls" }],
    );

    expect(graph.edges().length).toBe(1);

    syncGraphElements(
      graph,
      [
        { id: "a", label: "A", kind: "service" },
        { id: "b", label: "B", kind: "service" },
      ],
      [],
    );

    expect(graph.edges().length).toBe(0);
    expect(graph.nodes().length).toBe(2);
  });

  it("replaces edges when endpoints change but the edge id stays the same", () => {
    graph = cytoscape({ headless: true });
    syncGraphElements(
      graph,
      [
        { id: "a", label: "A", kind: "service" },
        { id: "b", label: "B", kind: "service" },
        { id: "c", label: "C", kind: "service" },
      ],
      [{ id: "e1", source: "a", target: "b", kind: "calls" }],
    );

    syncGraphElements(
      graph,
      [
        { id: "a", label: "A", kind: "service" },
        { id: "b", label: "B", kind: "service" },
        { id: "c", label: "C", kind: "service" },
      ],
      [{ id: "e1", source: "a", target: "c", kind: "calls" }],
    );

    const edge = graph.getElementById("e1");
    expect(edge.nonempty()).toBe(true);
    expect(edge.data("target")).toBe("c");
  });
});
