/**
 * Tests for dependencies graph projection and evidence lookup.
 */

import { describe, expect, it } from "vitest";
import type { SoftwareGraph } from "../../types";
import { findEdgeEvidence, projectDependenciesGraph } from "./_projection.js";

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

describe("projectDependenciesGraph", () => {
  it("projects dependency edge kinds and endpoint nodes", () => {
    const graph = makeGraph({
      nodes: [
        { id: "file:a", kind: "file", label: "a.ts", metadata: {} },
        { id: "file:b", kind: "file", label: "b.ts", metadata: {} },
        { id: "svc:x", kind: "service", label: "svc", metadata: {} },
      ],
      edges: [
        { id: "e-import", kind: "imports", sourceId: "file:a", targetId: "file:b", metadata: {} },
        { id: "e-api", kind: "api", sourceId: "file:a", targetId: "svc:x", metadata: {} },
        { id: "e-contains", kind: "contains", sourceId: "file:a", targetId: "svc:x", metadata: {} },
      ],
    });

    const projected = projectDependenciesGraph(graph);

    expect(projected.edges.map((edge) => edge.id).sort()).toEqual(["e-api", "e-import"]);
    expect(projected.nodes.map((node) => node.id).sort()).toEqual(["file:a", "file:b", "svc:x"]);
  });

  it("filters edges by visible kinds independently", () => {
    const graph = makeGraph({
      nodes: [
        { id: "file:a", kind: "file", label: "a.ts", metadata: {} },
        { id: "file:b", kind: "file", label: "b.ts", metadata: {} },
      ],
      edges: [
        { id: "e-import", kind: "imports", sourceId: "file:a", targetId: "file:b", metadata: {} },
        { id: "e-call", kind: "calls", sourceId: "file:b", targetId: "file:a", metadata: {} },
      ],
    });

    const importsOnly = projectDependenciesGraph(graph, {
      visibleEdgeKinds: new Set(["imports"]),
    });
    expect(importsOnly.edges).toHaveLength(1);
    expect(importsOnly.edges[0].kind).toBe("imports");

    const none = projectDependenciesGraph(graph, { visibleEdgeKinds: new Set() });
    expect(none.edges).toHaveLength(0);
    expect(none.nodes).toHaveLength(0);
  });
});

describe("findEdgeEvidence", () => {
  it("returns evidence linked by fact id metadata", () => {
    const graph = makeGraph({
      edges: [
        {
          id: "e1",
          kind: "imports",
          sourceId: "file:a",
          targetId: "file:b",
          metadata: { evidenceFactId: "fact-1" },
        },
      ],
      evidence: [
        {
          id: "ev-1",
          factId: "fact-1",
          kind: "ast-import",
          filePath: "src/a.ts",
          line: 3,
          excerpt: "import x from './b'",
        },
      ],
    });

    const result = findEdgeEvidence(graph, "e1");
    expect(result?.edge.id).toBe("e1");
    expect(result?.evidence).toHaveLength(1);
    expect(result?.evidence[0].excerpt).toContain("import");
  });

  it("returns null when edge id is missing", () => {
    const graph = makeGraph();
    expect(findEdgeEvidence(graph, null)).toBeNull();
    expect(findEdgeEvidence(graph, "missing")).toBeNull();
  });
});
