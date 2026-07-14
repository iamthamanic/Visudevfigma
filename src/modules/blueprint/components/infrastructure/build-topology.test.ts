/**
 * Tests for infrastructure topology node classification.
 */

import { describe, it, expect } from "vitest";
import { buildTopologyNodes, classifyTopologyTier } from "./build-topology.js";
import type { GraphCanvasNode } from "../../types";

describe("build-topology", () => {
  it("classifies service and database kinds", () => {
    expect(classifyTopologyTier("service")).toBe("service");
    expect(classifyTopologyTier("table")).toBe("database");
    expect(classifyTopologyTier("symbol")).toBeNull();
  });

  it("builds topology refs from projected nodes", () => {
    const nodes: GraphCanvasNode[] = [
      { id: "svc:api", label: "API", kind: "service" },
      { id: "tbl:db", label: "PostgreSQL", kind: "table" },
    ];
    const topology = buildTopologyNodes(nodes);
    expect(topology).toHaveLength(2);
    expect(topology[0].tier).toBe("service");
    expect(topology[1].tier).toBe("database");
  });
});
