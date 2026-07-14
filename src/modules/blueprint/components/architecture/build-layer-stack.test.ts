/**
 * Tests for buildArchitectureStackCards edge grouping.
 */

import { describe, it, expect } from "vitest";
import { buildArchitectureStackCards } from "./build-layer-stack.js";
import type { SoftwareGraph } from "../../types";

const graph: SoftwareGraph = {
  version: 1,
  projectId: "p1",
  analyzedAt: "2026-01-01T00:00:00.000Z",
  scopes: [],
  nodes: [
    { id: "domain:a", kind: "domain", label: "A", metadata: {} },
    { id: "layer:a:1", kind: "layer", label: "L1", metadata: {} },
    { id: "module:a:1", kind: "module", label: "M1", metadata: {} },
  ],
  edges: [
    { id: "e1", kind: "contains", sourceId: "domain:a", targetId: "layer:a:1", metadata: {} },
    { id: "e2", kind: "contains", sourceId: "layer:a:1", targetId: "module:a:1", metadata: {} },
  ],
  evidence: [],
  groups: [],
  metrics: [],
  condensed: false,
  limits: { maxNodes: 2500, maxEdges: 5000 },
};

describe("buildArchitectureStackCards", () => {
  it("groups contained children by parent id", () => {
    const layers = buildArchitectureStackCards(graph, "layer");
    expect(layers).toHaveLength(1);
    expect(layers[0].services).toEqual(["M1"]);
  });
});
