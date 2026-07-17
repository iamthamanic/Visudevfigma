import { describe, expect, it } from "vitest";
import type { SoftwareGraphNode } from "../../../shared/software-graph.types.js";
import { enrichSoftwareGraphIfThin } from "../../../shared/demo-graph-thin.js";
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

    expect((normalized.routes ?? []).length).toBeGreaterThanOrEqual(1);
    expect((normalized.securityMatrix ?? []).length).toBeGreaterThanOrEqual(1);
    expect((normalized.facts ?? []).length).toBeGreaterThanOrEqual(1);
    expect(normalized.findings?.length).toBeGreaterThanOrEqual(1);
  });

  it("enriches thin graphs with demo seed data via thin helper", () => {
    const thinGraph = {
      version: 1 as const,
      projectId: "p1",
      analyzedAt: "2026-01-01T00:00:00.000Z",
      scopes: [],
      nodes: [{ id: "m1", kind: "module" as const, label: "core", metadata: {} }],
      edges: [],
      evidence: [],
      groups: [],
      metrics: [],
      condensed: false,
      limits: { maxNodes: 2500, maxEdges: 5000 },
    };
    const enriched = enrichSoftwareGraphIfThin(thinGraph, "p1");
    expect(enriched.nodes.filter((node) => node.kind === "layer").length).toBeGreaterThanOrEqual(7);
  });

  it("prefers graph-derived diagnostics over stale legacy fields on rich graphs", () => {
    const moduleNodes: SoftwareGraphNode[] = Array.from({ length: 22 }, (_, index) => ({
      id: `mod:${index}`,
      kind: "module",
      label: `module-${index}`,
      metadata: {},
    }));
    const layerNodes: SoftwareGraphNode[] = [
      "Experience Layer",
      "Application Layer",
      "Domain Layer",
      "Integration Layer",
      "Persistence Layer",
      "Processing Layer",
      "Platform Layer",
    ].map((label, index) => ({
      id: `layer:${index}`,
      kind: "layer" as const,
      label,
      metadata: {},
    }));
    const richNodes = [...moduleNodes, ...layerNodes];
    const richEdges = Array.from({ length: 12 }, (_, index) => ({
      id: `edge:${index}`,
      kind: "contains" as const,
      sourceId: `layer:${index % 7}`,
      targetId: `mod:${index % 22}`,
      metadata: {},
    }));

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
        nodes: richNodes,
        edges: richEdges,
        evidence: [],
        groups: [{ id: "g1", kind: "module", label: "core", nodeIds: ["mod:0"] }],
        metrics: [{ id: "m1", name: "modules", value: 22 }],
        condensed: false,
        limits: { maxNodes: 2500, maxEdges: 5000 },
        snapshots: [
          {
            id: "s1",
            label: "a",
            ref: "a1",
            capturedAt: "2026-01-01T00:00:00.000Z",
            nodeIds: ["mod:0"],
          },
          {
            id: "s2",
            label: "b",
            ref: "b2",
            capturedAt: "2026-01-02T00:00:00.000Z",
            nodeIds: ["mod:1"],
          },
          {
            id: "s3",
            label: "c",
            ref: "c3",
            capturedAt: "2026-01-03T00:00:00.000Z",
            nodeIds: ["mod:2"],
          },
        ],
      },
    });

    expect(normalized.graph?.nodes.some((node) => node.id === "route:leave")).toBe(false);
    // Richer legacy routes are kept when graph derivation yields fewer routes (Wave 4).
    expect(normalized.routes?.length).toBe(1);
    expect(normalized.routes?.[0]?.id).toBe("legacy");
  });

  it("preserves accessControlMatrix and synthesizes legacy securityMatrix when absent", () => {
    const accessControlMatrix = [
      {
        routeId: "r1",
        method: "GET",
        path: "/api/x",
        authentication: { status: "protected" as const },
        authorization: { status: "protected" as const },
        resourceScope: { status: "partial" as const },
        tenantIsolation: { status: "missing" as const },
        ownership: { status: "unverified" as const },
        validation: { status: "protected" as const },
        rateLimit: { status: "unverified" as const },
        audit: { status: "unverified" as const },
        overallStatus: "missing" as const,
        findingCount: 1,
      },
    ];
    const normalized = normalizeBlueprintData({
      routes: [],
      securityMatrix: [],
      accessControlMatrix,
    });
    expect(normalized.accessControlMatrix).toEqual(accessControlMatrix);
    expect(normalized.securityMatrix?.[0]?.rls.state).toBe("n/a");
    expect(normalized.securityMatrix?.[0]?.auth.state).toBe("confirmed");
  });

  it("drops malformed accessControlMatrix rows instead of casting", () => {
    const normalized = normalizeBlueprintData({
      accessControlMatrix: [{ routeId: "bad" }, null, "x"],
      accessControlFindings: [{ id: "x" }],
    });
    expect(normalized.accessControlMatrix).toBeUndefined();
    expect(normalized.accessControlFindings).toBeUndefined();
  });
});
