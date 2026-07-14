import { describe, expect, it } from "vitest";
import { normalizeBlueprintData } from "./normalize-blueprint";

describe("normalizeBlueprintData", () => {
  it("drops malformed route and finding entries from KV payloads", () => {
    const normalized = normalizeBlueprintData({
      routes: [{ id: "r1", method: "GET" }, null, "bad"],
      securityMatrix: [{ routeId: "r1" }],
      findings: [{ id: "f1", severity: "critical" }],
      facts: [{ id: "fact-1" }],
      frameworkHints: ["next", 42, ""],
    });

    expect(normalized.routes).toEqual([]);
    expect(normalized.securityMatrix).toEqual([]);
    expect(normalized.findings).toEqual([]);
    expect(normalized.facts).toEqual([]);
    expect(normalized.frameworkHints).toEqual(["next"]);
  });

  it("synthesizes legacy diagnostics from graph-only payloads", () => {
    const normalized = normalizeBlueprintData({
      graph: {
        version: 1,
        projectId: "p1",
        analyzedAt: "2026-01-01T00:00:00.000Z",
        scopes: [],
        nodes: [
          {
            id: "route:1",
            kind: "route",
            label: "POST /api/items",
            filePath: "/api/items.ts",
            line: 4,
            metadata: { routeId: "r1", method: "POST", path: "/api/items" },
          },
        ],
        edges: [],
        evidence: [
          {
            id: "ev1",
            factId: "fact-1",
            kind: "code:snippet",
            filePath: "/api/items.ts",
            line: 5,
            excerpt: "handler()",
          },
        ],
        groups: [],
        metrics: [],
        condensed: false,
        limits: { maxNodes: 2500, maxEdges: 5000 },
      },
    });

    expect(normalized.routes).toHaveLength(1);
    expect(normalized.securityMatrix).toHaveLength(1);
    expect(normalized.facts).toHaveLength(1);
    expect(normalized.findings?.length).toBeGreaterThanOrEqual(1);
  });

  it("prefers empty graph-derived diagnostics over stale legacy fields", () => {
    const normalized = normalizeBlueprintData({
      routes: [
        {
          id: "legacy",
          method: "GET",
          path: "/old",
          filePath: "a.ts",
          line: 1,
          pipeline: [],
          concepts: {},
        },
      ],
      graph: {
        version: 1,
        projectId: "p1",
        analyzedAt: "2026-01-01T00:00:00.000Z",
        scopes: [],
        nodes: [{ id: "m1", kind: "module", label: "core", metadata: {} }],
        edges: [],
        evidence: [],
        groups: [],
        metrics: [],
        condensed: false,
        limits: { maxNodes: 2500, maxEdges: 5000 },
      },
    });

    expect(normalized.routes).toEqual([]);
  });
});
