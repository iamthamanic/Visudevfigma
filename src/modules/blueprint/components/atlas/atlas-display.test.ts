/**
 * Tests for Atlas display helpers.
 */

import { describe, it, expect } from "vitest";
import type { SoftwareGraph } from "../../types";
import {
  listDeploymentHints,
  listOutgoingDependencies,
  listVisibleGroups,
  resolveNodeLabels,
} from "./atlas-display";

const graph: SoftwareGraph = {
  version: 1,
  projectId: "p1",
  analyzedAt: "2026-01-01T00:00:00.000Z",
  scopes: [],
  nodes: [
    { id: "f1", kind: "file", label: "handler.ts", metadata: { runtime: "server" } },
    { id: "r1", kind: "runtime", label: "runtime", metadata: { runtimes: ["server"] } },
  ],
  edges: [{ id: "e1", kind: "contains", sourceId: "r1", targetId: "f1", metadata: {} }],
  evidence: [],
  groups: [{ id: "g1", kind: "file", label: "server", nodeIds: ["f1"] }],
  metrics: [],
  condensed: false,
  limits: { maxNodes: 2500, maxEdges: 5000 },
};

describe("atlas-display", () => {
  it("lists visible groups intersecting node ids", () => {
    const groups = listVisibleGroups(graph, new Set(["f1"]));
    expect(groups).toHaveLength(1);
    expect(groups[0]?.label).toBe("server");
  });

  it("collects deployment hints from metadata and linked runtime nodes", () => {
    const node = graph.nodes[0]!;
    const hints = listDeploymentHints(graph, node);
    expect(hints).toContain("server");
    expect(hints).toContain("runtime");
  });

  it("truncates cluster member labels with omitted count", () => {
    const ids = Array.from({ length: 30 }, (_, index) => `n${index}`);
    const labels = resolveNodeLabels(
      {
        ...graph,
        nodes: ids.map((id) => ({ id, kind: "module" as const, label: id, metadata: {} })),
      },
      ids,
      24,
    );
    expect(labels.labels).toHaveLength(24);
    expect(labels.omittedCount).toBe(6);
  });

  it("returns empty dependencies when none exist", () => {
    expect(listOutgoingDependencies(graph, "f1")).toEqual([]);
  });
});
