/**
 * Tests for evolution snapshot diffing.
 */

import { describe, expect, it } from "vitest";
import type { SoftwareGraph } from "../../types";
import { diffSnapshots } from "./_diff.js";

function makeGraph(
  snapshots: SoftwareGraph["snapshots"],
  nodes: SoftwareGraph["nodes"],
): SoftwareGraph {
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
    snapshots,
  };
}

describe("diffSnapshots", () => {
  it("detects added and removed nodes", () => {
    const base = {
      id: "s1",
      label: "base",
      ref: "base",
      capturedAt: "2026-01-01T00:00:00.000Z",
      nodeIds: ["a", "b"],
      nodeSignatures: { a: "file:a", b: "file:b" },
    };
    const target = {
      id: "s2",
      label: "target",
      ref: "target",
      capturedAt: "2026-01-02T00:00:00.000Z",
      nodeIds: ["b", "c"],
      nodeSignatures: { b: "file:b", c: "file:c" },
    };
    const graph = makeGraph(
      [base, target],
      [
        { id: "a", kind: "file", label: "a", metadata: {} },
        { id: "b", kind: "file", label: "b", metadata: {} },
        { id: "c", kind: "file", label: "c", metadata: {} },
      ],
    );

    const diff = diffSnapshots(graph, base, target);
    expect(diff.addedNodeIds).toEqual(["c"]);
    expect(diff.removedNodeIds).toEqual(["a"]);
    expect(diff.identical).toBe(false);
  });

  it("marks identical snapshots", () => {
    const snapshot = {
      id: "s1",
      label: "same",
      ref: "same",
      capturedAt: "2026-01-01T00:00:00.000Z",
      nodeIds: ["a"],
      nodeSignatures: { a: "file:a" },
    };
    const graph = makeGraph([snapshot], [{ id: "a", kind: "file", label: "a", metadata: {} }]);
    const diff = diffSnapshots(graph, snapshot, snapshot);
    expect(diff.identical).toBe(true);
  });
});
