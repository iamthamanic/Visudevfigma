import { describe, expect, it } from "vitest";
import type { SoftwareGraph } from "../../types";
import {
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
});
