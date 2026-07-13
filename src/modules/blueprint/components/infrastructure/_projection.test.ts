import { describe, expect, it } from "vitest";
import { projectInfrastructureGraph } from "./_projection";

describe("projectInfrastructureGraph", () => {
  it("does not emit hosts edges when synthetic runtime ids collide with graph nodes", () => {
    const runtime = "node";
    const syntheticId = `infra:v1:runtime:${runtime}`;
    const graph = projectInfrastructureGraph({
      version: 1,
      projectId: "p1",
      analyzedAt: "2026-01-01T00:00:00Z",
      scopes: [],
      evidence: [],
      groups: [],
      metrics: [],
      condensed: false,
      limits: { maxNodes: 2500, maxEdges: 5000 },
      nodes: [
        { id: syntheticId, kind: "service", label: "Crafted", metadata: {} },
        {
          id: "file-1",
          kind: "file",
          label: "app.ts",
          metadata: { runtime },
        },
      ],
      edges: [],
    });

    expect(graph.nodes.some((node) => node.id === syntheticId)).toBe(true);
    expect(graph.edges).toHaveLength(0);
  });

  it("does not merge distinct runtime labels that share a long prefix", () => {
    const prefix = "r".repeat(63);
    const graph = projectInfrastructureGraph({
      version: 1,
      projectId: "p1",
      analyzedAt: "2026-01-01T00:00:00Z",
      scopes: [],
      evidence: [],
      groups: [],
      metrics: [],
      condensed: false,
      limits: { maxNodes: 2500, maxEdges: 5000 },
      nodes: [
        {
          id: "file-a",
          kind: "file",
          label: "a.ts",
          metadata: { runtime: `${prefix}a` },
        },
        {
          id: "file-b",
          kind: "file",
          label: "b.ts",
          metadata: { runtime: `${prefix}b` },
        },
      ],
      edges: [],
    });

    const runtimeNodes = graph.nodes.filter((node) => node.kind === "runtime");
    expect(runtimeNodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(2);
  });
});
