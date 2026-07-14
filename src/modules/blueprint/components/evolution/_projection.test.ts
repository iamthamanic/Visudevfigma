/**
 * Tests for evolution graph projection with removed nodes absent from current graph.
 */

import { describe, expect, it } from "vitest";
import { projectEvolutionGraph } from "./_projection";
import type { SoftwareGraph, SoftwareGraphDiffMetadata } from "../../types";

const graph: SoftwareGraph = {
  version: 1,
  projectId: "p1",
  analyzedAt: "2026-01-01T00:00:00.000Z",
  scopes: [],
  nodes: [{ id: "kept", kind: "file", label: "kept.ts", metadata: {} }],
  edges: [],
  evidence: [],
  groups: [],
  metrics: [],
  condensed: false,
  limits: { maxNodes: 2500, maxEdges: 5000 },
};

const removedOnlyDiff: SoftwareGraphDiffMetadata = {
  baseSnapshotId: "s1",
  targetSnapshotId: "s2",
  addedNodeIds: [],
  removedNodeIds: ["gone"],
  changedNodeIds: [],
  identical: false,
  condensed: false,
};

describe("projectEvolutionGraph", () => {
  it("renders removed nodes even when missing from the current graph", () => {
    const projection = projectEvolutionGraph(graph, removedOnlyDiff);
    expect(projection.nodes).toHaveLength(1);
    expect(projection.nodes[0]?.id).toBe("gone");
    expect(projection.nodes[0]?.color).toBe("var(--color-destructive)");
  });
});
