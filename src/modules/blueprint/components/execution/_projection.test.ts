/**
 * Tests for execution graph projection.
 */

import { describe, expect, it } from "vitest";
import type { SoftwareGraph } from "../../types";
import {
  listExecutionRoutes,
  projectExecutionGraph,
  computeStepTimings,
  computeExecutionMetrics,
  isExecutionLive,
} from "./_projection.js";

function makeGraph(overrides: Partial<SoftwareGraph> = {}): SoftwareGraph {
  return {
    version: 1,
    projectId: "p1",
    analyzedAt: "2026-01-01T00:00:00.000Z",
    scopes: [],
    nodes: [],
    edges: [],
    evidence: [],
    groups: [],
    metrics: [],
    condensed: false,
    limits: { maxNodes: 2500, maxEdges: 5000 },
    ...overrides,
  };
}

describe("projectExecutionGraph", () => {
  it("projects sequential pipeline edges left-to-right", () => {
    const graph = makeGraph({
      nodes: [
        {
          id: "route:users:get",
          kind: "route",
          label: "GET /users",
          scopeId: "file:handler",
          filePath: "src/routes/users.ts",
          line: 1,
          metadata: { routeId: "route:users:get" },
        },
        { id: "file:handler", kind: "file", label: "users.ts", metadata: {} },
        { id: "svc:db", kind: "service", label: "UserService", metadata: {} },
      ],
      groups: [
        {
          id: "execution:route:users:get:0",
          kind: "route",
          label: "GET /users · path 1",
          nodeIds: ["route:users:get", "file:handler", "svc:db"],
        },
      ],
    });

    const projected = projectExecutionGraph(graph, { routeId: "route:users:get" });
    expect(projected?.nodes).toHaveLength(3);
    expect(projected?.edges).toHaveLength(2);
    expect(projected?.edges[0].source).toBe("route:users:get");
    expect(projected?.edges[1].target).toBe("svc:db");
  });

  it("lists route selectors from graph nodes", () => {
    const graph = makeGraph({
      nodes: [
        {
          id: "route:a",
          kind: "route",
          label: "GET /a",
          metadata: { routeId: "route:a" },
        },
      ],
    });
    expect(listExecutionRoutes(graph)).toEqual([{ routeId: "route:a", label: "GET /a" }]);
  });

  it("computes step timings and metrics", () => {
    const graph = makeGraph({
      nodes: [
        {
          id: "route:users:get",
          kind: "route",
          label: "GET /users",
          metadata: { routeId: "route:users:get", durationMs: 20 },
        },
        { id: "file:handler", kind: "file", label: "users.ts", metadata: { durationMs: 30 } },
      ],
      groups: [
        {
          id: "execution:route:users:get:0",
          kind: "route",
          label: "GET /users · path 1",
          nodeIds: ["route:users:get", "file:handler"],
        },
      ],
    });

    const projected = projectExecutionGraph(graph, { routeId: "route:users:get" });
    const timings = computeStepTimings(graph, projected!.stepNodeIds);
    expect(timings).toEqual([
      { nodeId: "route:users:get", durationMs: 20, startMs: 0, endMs: 20 },
      { nodeId: "file:handler", durationMs: 30, startMs: 20, endMs: 50 },
    ]);

    const metrics = computeExecutionMetrics(projected, graph);
    expect(metrics).toEqual({ totalDurationMs: 50, stepCount: 2, errorCount: 0 });
  });

  it("detects live execution from route metadata", () => {
    const graph = makeGraph({
      nodes: [
        {
          id: "route:a",
          kind: "route",
          label: "GET /a",
          metadata: { routeId: "route:a", executionStatus: "running" },
        },
      ],
    });
    expect(isExecutionLive(graph, "route:a")).toBe(true);
  });
});
