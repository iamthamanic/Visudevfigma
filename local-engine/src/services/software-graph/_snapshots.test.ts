/**
 * Tests for snapshot capture and merge.
 */

import { describe, expect, it } from "vitest";
import { attachSnapshotsToGraph, createGraphSnapshot, mergeGraphSnapshots } from "./_snapshots.js";
import type { SoftwareGraph } from "../../../../shared/software-graph.types.js";

function makeGraph(nodeIds: string[]): SoftwareGraph {
  return {
    version: 1,
    projectId: "p1",
    analyzedAt: "2026-01-01T00:00:00.000Z",
    scopes: [],
    nodes: nodeIds.map((id) => ({ id, kind: "file", label: id, metadata: {} })),
    edges: [],
    evidence: [],
    groups: [],
    metrics: [],
    condensed: false,
    limits: { maxNodes: 2500, maxEdges: 5000 },
  };
}

describe("createGraphSnapshot", () => {
  it("stores node ids and signatures", () => {
    const snapshot = createGraphSnapshot(makeGraph(["a", "b"]), {
      ref: "abc123",
      capturedAt: "2026-01-02T00:00:00.000Z",
      commitSha: "abc123",
    });
    expect(snapshot.nodeIds).toEqual(["a", "b"]);
    expect(snapshot.nodeSignatures?.a).toBe("file:a");
  });
});

describe("mergeGraphSnapshots", () => {
  it("appends unique snapshots and keeps order", () => {
    const first = createGraphSnapshot(makeGraph(["a"]), {
      ref: "v1",
      capturedAt: "2026-01-01T00:00:00.000Z",
    });
    const second = createGraphSnapshot(makeGraph(["a", "b"]), {
      ref: "v2",
      capturedAt: "2026-01-02T00:00:00.000Z",
    });
    const merged = mergeGraphSnapshots([first], second);
    expect(merged).toHaveLength(2);
    expect(merged[1].nodeIds).toContain("b");
  });
});

describe("attachSnapshotsToGraph", () => {
  it("writes snapshots onto graph", () => {
    const graph = attachSnapshotsToGraph(makeGraph(["n1"]), {
      ref: "current",
      capturedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(graph.snapshots).toHaveLength(1);
    expect(graph.snapshots?.[0].nodeIds).toEqual(["n1"]);
  });
});
