import { describe, expect, it } from "vitest";
import { DEFAULT_VISIBLE_KINDS, projectArchitectureGraph } from "./_projection";

describe("projectArchitectureGraph", () => {
  const baseGraph = {
    version: 1 as const,
    projectId: "p1",
    analyzedAt: "2026-01-01T00:00:00Z",
    scopes: [],
    evidence: [],
    groups: [],
    metrics: [],
    condensed: false,
    limits: { maxNodes: 2500, maxEdges: 5000 },
  };

  it("projects domain/layer/module hierarchy with containment edges", () => {
    const graph = projectArchitectureGraph({
      ...baseGraph,
      nodes: [
        { id: "domain:routes", kind: "domain", label: "routes", metadata: {} },
        { id: "layer:routes:presentation", kind: "layer", label: "presentation", metadata: {} },
        {
          id: "module:routes:presentation:routes",
          kind: "module",
          label: "routes",
          metadata: {},
        },
        { id: "file:src/routes/users.ts", kind: "file", label: "users.ts", metadata: {} },
        {
          id: "route:users:get",
          kind: "route",
          label: "GET /api/users",
          metadata: {},
        },
      ],
      edges: [
        {
          id: "e1",
          kind: "contains",
          sourceId: "domain:routes",
          targetId: "layer:routes:presentation",
          metadata: {},
        },
        {
          id: "e2",
          kind: "contains",
          sourceId: "layer:routes:presentation",
          targetId: "module:routes:presentation:routes",
          metadata: {},
        },
        {
          id: "e3",
          kind: "contains",
          sourceId: "module:routes:presentation:routes",
          targetId: "file:src/routes/users.ts",
          metadata: {},
        },
        {
          id: "e4",
          kind: "contains",
          sourceId: "file:src/routes/users.ts",
          targetId: "route:users:get",
          metadata: {},
        },
      ],
    });

    expect(graph.nodes.some((node) => node.kind === "domain")).toBe(true);
    expect(graph.nodes.some((node) => node.kind === "layer")).toBe(true);
    expect(graph.edges.some((edge) => edge.kind === "contains")).toBe(true);
    expect(graph.collapsible).toHaveLength(2);
  });

  it("hides descendants when a domain is collapsed", () => {
    const graph = projectArchitectureGraph(
      {
        ...baseGraph,
        nodes: [
          { id: "domain:routes", kind: "domain", label: "routes", metadata: {} },
          { id: "layer:routes:presentation", kind: "layer", label: "presentation", metadata: {} },
        ],
        edges: [
          {
            id: "e1",
            kind: "contains",
            sourceId: "domain:routes",
            targetId: "layer:routes:presentation",
            metadata: {},
          },
        ],
      },
      { collapsedIds: new Set(["domain:routes"]), visibleKinds: new Set(DEFAULT_VISIBLE_KINDS) },
    );

    expect(graph.nodes.some((node) => node.id === "domain:routes")).toBe(true);
    expect(graph.nodes.some((node) => node.id === "layer:routes:presentation")).toBe(false);
  });

  it("filters nodes by visible kind set", () => {
    const graph = projectArchitectureGraph(
      {
        ...baseGraph,
        nodes: [
          { id: "domain:routes", kind: "domain", label: "routes", metadata: {} },
          { id: "route:users:get", kind: "route", label: "GET /api/users", metadata: {} },
        ],
        edges: [],
      },
      { visibleKinds: new Set(["domain"]) },
    );

    expect(graph.nodes).toHaveLength(1);
    expect(graph.nodes[0].kind).toBe("domain");
  });

  it("hides descendants for multiple collapsed groups in one pass", () => {
    const graph = projectArchitectureGraph(
      {
        ...baseGraph,
        nodes: [
          { id: "domain:a", kind: "domain", label: "a", metadata: {} },
          { id: "layer:a:shared", kind: "layer", label: "shared", metadata: {} },
          { id: "domain:b", kind: "domain", label: "b", metadata: {} },
          { id: "layer:b:shared", kind: "layer", label: "shared", metadata: {} },
        ],
        edges: [
          {
            id: "e1",
            kind: "contains",
            sourceId: "domain:a",
            targetId: "layer:a:shared",
            metadata: {},
          },
          {
            id: "e2",
            kind: "contains",
            sourceId: "domain:b",
            targetId: "layer:b:shared",
            metadata: {},
          },
        ],
      },
      {
        collapsedIds: new Set(["domain:a", "domain:b"]),
        visibleKinds: new Set(DEFAULT_VISIBLE_KINDS),
      },
    );

    expect(graph.nodes.map((node) => node.id).sort()).toEqual(["domain:a", "domain:b"]);
  });

  it("bridges contains edges when intermediate file nodes are hidden", () => {
    const graph = projectArchitectureGraph(
      {
        ...baseGraph,
        nodes: [
          {
            id: "module:routes:presentation:routes",
            kind: "module",
            label: "routes",
            metadata: {},
          },
          { id: "file:src/routes/users.ts", kind: "file", label: "users.ts", metadata: {} },
          { id: "route:users:get", kind: "route", label: "GET /api/users", metadata: {} },
        ],
        edges: [
          {
            id: "e1",
            kind: "contains",
            sourceId: "module:routes:presentation:routes",
            targetId: "file:src/routes/users.ts",
            metadata: {},
          },
          {
            id: "e2",
            kind: "contains",
            sourceId: "file:src/routes/users.ts",
            targetId: "route:users:get",
            metadata: {},
          },
        ],
      },
      { visibleKinds: new Set(["module", "route"]) },
    );

    expect(graph.nodes.map((node) => node.id)).toEqual([
      "module:routes:presentation:routes",
      "route:users:get",
    ]);
    expect(
      graph.edges.some((edge) => edge.kind === "contains" && edge.target === "route:users:get"),
    ).toBe(true);
  });

  it("does not invent contains edges for pure cyclic graphs", () => {
    const graph = projectArchitectureGraph(
      {
        ...baseGraph,
        nodes: [
          { id: "module:a", kind: "module", label: "a", metadata: {} },
          { id: "route:x", kind: "route", label: "GET /x", metadata: {} },
        ],
        edges: [
          { id: "e1", kind: "contains", sourceId: "module:a", targetId: "route:x", metadata: {} },
          { id: "e2", kind: "contains", sourceId: "route:x", targetId: "module:a", metadata: {} },
        ],
      },
      { visibleKinds: new Set(["module", "route"]) },
    );

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges.filter((edge) => edge.kind === "contains")).toHaveLength(0);
  });

  it("keeps collapsed domain visible when contains cycle reaches back to it", () => {
    const graph = projectArchitectureGraph(
      {
        ...baseGraph,
        nodes: [
          { id: "domain:routes", kind: "domain", label: "routes", metadata: {} },
          { id: "layer:routes:presentation", kind: "layer", label: "presentation", metadata: {} },
        ],
        edges: [
          {
            id: "e1",
            kind: "contains",
            sourceId: "domain:routes",
            targetId: "layer:routes:presentation",
            metadata: {},
          },
          {
            id: "e2",
            kind: "contains",
            sourceId: "layer:routes:presentation",
            targetId: "domain:routes",
            metadata: {},
          },
        ],
      },
      { collapsedIds: new Set(["domain:routes"]), visibleKinds: new Set(DEFAULT_VISIBLE_KINDS) },
    );

    expect(graph.nodes.some((node) => node.id === "domain:routes")).toBe(true);
    expect(graph.nodes.some((node) => node.id === "layer:routes:presentation")).toBe(false);
  });
});
