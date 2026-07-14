import { describe, expect, it } from "vitest";
import type { SoftwareGraph } from "../../types";
import {
  dedupeArchitectureNodes,
  sanitizeArchitectureLabel,
  sanitizeSoftwareGraphForArchitecture,
} from "./_projection-validate";

describe("sanitizeSoftwareGraphForArchitecture", () => {
  it("drops edges that reference missing nodes", () => {
    const sanitized = sanitizeSoftwareGraphForArchitecture({
      version: 1,
      projectId: "p1",
      analyzedAt: "2026-01-01T00:00:00Z",
      scopes: [],
      evidence: [],
      groups: [],
      metrics: [],
      condensed: false,
      limits: { maxNodes: 2500, maxEdges: 5000 },
      nodes: [{ id: "domain:a", kind: "domain", label: "a", metadata: {} }],
      edges: [
        {
          id: "e1",
          kind: "contains",
          sourceId: "domain:a",
          targetId: "missing",
          metadata: {},
        },
      ],
    });

    expect(sanitized.edges).toHaveLength(0);
  });

  it("drops nodes with unknown kinds during sanitization", () => {
    const sanitized = sanitizeSoftwareGraphForArchitecture({
      version: 1,
      projectId: "p1",
      analyzedAt: "2026-01-01T00:00:00Z",
      scopes: [],
      evidence: [],
      groups: [],
      metrics: [],
      condensed: false,
      limits: { maxNodes: 2500, maxEdges: 5000 },
      nodes: [{ id: "n1", kind: "not-a-kind" as never, label: "x", metadata: {} }],
      edges: [],
    });

    expect(sanitized.nodes).toHaveLength(0);
  });

  it("handles malformed node and edge collections", () => {
    const sanitized = sanitizeSoftwareGraphForArchitecture({
      version: 1,
      projectId: "p1",
      analyzedAt: "2026-01-01T00:00:00Z",
      scopes: [],
      evidence: [],
      groups: [],
      metrics: [],
      condensed: false,
      limits: { maxNodes: 2500, maxEdges: 5000 },
      nodes: null as unknown as SoftwareGraph["nodes"],
      edges: [
        null,
        { id: "e1", kind: "contains", sourceId: "a", targetId: "b" },
      ] as unknown as SoftwareGraph["edges"],
    });

    expect(sanitized.nodes).toEqual([]);
    expect(sanitized.edges).toEqual([]);
  });

  it("normalizes empty labels", () => {
    expect(sanitizeArchitectureLabel("   ")).toBe("(unbenannt)");
    expect(sanitizeArchitectureLabel(42)).toBe("(unbenannt)");
  });

  it("dedupes domain nodes with the same file path", () => {
    const { nodes: deduped } = dedupeArchitectureNodes([
      {
        id: "domain:1",
        kind: "domain",
        label: "App.tsx",
        metadata: { filePath: "src/App.tsx" },
      },
      {
        id: "domain:2",
        kind: "domain",
        label: "App.tsx",
        metadata: { filePath: "src/App.tsx" },
      },
    ]);

    expect(deduped).toHaveLength(1);
    expect(deduped[0].id).toBe("domain:1");
  });

  it("remaps edges from duplicate nodes to the kept node", () => {
    const sanitized = sanitizeSoftwareGraphForArchitecture({
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
          id: "domain:1",
          kind: "domain",
          label: "App.tsx",
          metadata: { filePath: "src/App.tsx" },
        },
        {
          id: "domain:2",
          kind: "domain",
          label: "App.tsx",
          metadata: { filePath: "src/App.tsx" },
        },
        { id: "layer:1", kind: "layer", label: "L1", metadata: {} },
      ],
      edges: [
        {
          id: "e1",
          kind: "contains",
          sourceId: "layer:1",
          targetId: "domain:2",
          metadata: {},
        },
      ],
    });

    expect(sanitized.nodes).toHaveLength(2);
    expect(sanitized.edges).toHaveLength(1);
    expect(sanitized.edges[0].targetId).toBe("domain:1");
  });
});
