/**
 * Tests for graph builder limit helpers (incl. prefer edges past node condensation).
 * Location: local-engine/src/services/software-graph/_state.test.ts
 */

import { describe, expect, it } from "vitest";
import { addEdge, addEdgePrefer, createBuilderState, DEFAULT_LIMITS } from "./_state.js";

describe("addEdgePrefer", () => {
  it("adds leave-critical edges after node-cap condensation when edge budget remains", () => {
    const state = createBuilderState();
    state.condensed = true;
    state.nodeCount = DEFAULT_LIMITS.maxNodes;
    state.edgeCount = 10;

    addEdge(state, {
      id: "edge:dropped",
      kind: "data",
      sourceId: "a",
      targetId: "b",
      metadata: {},
    });
    expect(state.edges.has("edge:dropped")).toBe(false);

    addEdgePrefer(state, {
      id: "edge:leave",
      kind: "data",
      sourceId: "file:leaves",
      targetId: "table:prisma:LeaveRequest",
      metadata: { reason: "leave-route-db-fact" },
    });
    expect(state.edges.has("edge:leave")).toBe(true);
    expect(state.edgeCount).toBe(11);
  });

  it("still refuses prefer edges at maxEdges", () => {
    const state = createBuilderState();
    state.condensed = true;
    state.edgeCount = DEFAULT_LIMITS.maxEdges;

    addEdgePrefer(state, {
      id: "edge:overflow",
      kind: "data",
      sourceId: "a",
      targetId: "b",
      metadata: { reason: "leave-route-db-fact" },
    });
    expect(state.edges.has("edge:overflow")).toBe(false);
  });
});
