/**
 * Tests for Atlas graph projection condensation and search.
 */

import { describe, expect, it } from "vitest";
import { projectAtlasGraph } from "./_projection";
import type { SoftwareGraph } from "../../types";

function makeGraph(nodeCount: number): SoftwareGraph {
  const nodes = Array.from({ length: nodeCount }, (_, index) => ({
    id: `n${index}`,
    kind: index % 3 === 0 ? ("file" as const) : ("module" as const),
    label: index === 7 ? "payments-core" : `node-${index}`,
    metadata: {},
  }));
  return {
    version: 1,
    projectId: "p1",
    analyzedAt: "2026-01-01T00:00:00.000Z",
    scopes: [],
    nodes,
    edges: [],
    evidence: [],
    groups: [],
    metrics: [],
    condensed: false,
    limits: { maxNodes: 2500, maxEdges: 5000 },
  };
}

describe("projectAtlasGraph", () => {
  it("condenses large graphs to overview kinds", () => {
    const projection = projectAtlasGraph(makeGraph(500));
    expect(projection.condensed).toBe(true);
    expect(projection.visibleNodes).toBeLessThanOrEqual(400);
    expect(projection.nodes.every((node) => node.kind === "module")).toBe(true);
  });

  it("filters nodes by search query", () => {
    const projection = projectAtlasGraph(makeGraph(20), { searchQuery: "payments" });
    expect(projection.nodes).toHaveLength(1);
    expect(projection.nodes[0]?.label).toContain("payments");
  });
});
