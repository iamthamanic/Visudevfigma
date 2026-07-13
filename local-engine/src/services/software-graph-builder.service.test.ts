/**
 * Unit tests for software-graph-builder.service.ts
 * Location: local-engine/src/services/software-graph-builder.service.test.ts
 */

import { describe, expect, it } from "vitest";
import { buildSoftwareGraph } from "./software-graph-builder.service.js";
import type { RawBlueprintScan } from "../types/api.types.js";

function makeScan(overrides: Partial<RawBlueprintScan> = {}): RawBlueprintScan {
  return {
    providerId: "autoguide",
    projectId: "test-project",
    localPath: "/tmp/test-project",
    analyzedAt: new Date().toISOString(),
    routes: [],
    facts: [],
    filesAnalyzed: 0,
    ...overrides,
  };
}

describe("buildSoftwareGraph", () => {
  it("returns empty valid graph for empty scan", () => {
    const scan = makeScan();
    const graph = buildSoftwareGraph(scan);

    expect(graph.version).toBe(1);
    expect(graph.projectId).toBe("test-project");
    expect(graph.nodes.length).toBeGreaterThan(0);
    expect(graph.condensed).toBe(false);
    expect(graph.nodes.some((n) => n.kind === "organization")).toBe(true);
    expect(graph.nodes.some((n) => n.kind === "application")).toBe(true);
    expect(graph.nodes.some((n) => n.kind === "runtime")).toBe(true);
  });

  it("creates domain/module/file hierarchy from route paths", () => {
    const scan = makeScan({
      filesAnalyzed: 2,
      routes: [
        {
          id: "route:users:get",
          method: "get",
          path: "/api/users",
          filePath: "src/routes/users.ts",
          line: 10,
        },
      ],
    });

    const graph = buildSoftwareGraph(scan);

    expect(graph.nodes.some((n) => n.kind === "domain" && n.id === "domain:routes")).toBe(true);
    expect(graph.nodes.some((n) => n.kind === "module" && n.id === "module:routes:routes")).toBe(
      true,
    );
    expect(graph.nodes.some((n) => n.kind === "file" && n.id === "file:src/routes/users.ts")).toBe(
      true,
    );
    expect(graph.nodes.some((n) => n.kind === "route" && n.id === "route:route:users:get")).toBe(
      true,
    );
  });

  it("maps facts to evidence and inferred nodes", () => {
    const scan = makeScan({
      filesAnalyzed: 1,
      facts: [
        {
          id: "fact:1",
          kind: "autoguide:db-read",
          filePath: "src/routes/users.ts",
          line: 15,
          snippet: "supabase.from('users').select()",
        },
      ],
    });

    const graph = buildSoftwareGraph(scan);

    expect(graph.evidence.length).toBe(1);
    expect(graph.evidence[0].excerpt).toContain("supabase");
    expect(graph.nodes.some((n) => n.kind === "table")).toBe(true);
    expect(graph.edges.some((e) => e.kind === "data")).toBe(true);
  });

  it("sanitizes long snippets and secret-like metadata", () => {
    const scan = makeScan({
      filesAnalyzed: 1,
      facts: [
        {
          id: "fact:2",
          kind: "autoguide:auth",
          filePath: "src/routes/auth.ts",
          line: 1,
          snippet: "// " + "x ".repeat(200),
          metadata: {
            apiKey: "super-secret",
            safeField: "ok",
            headers: [
              "Authorization: Bearer sk-12345678901234567890123456789012345678901234567890",
            ],
          },
        },
      ],
    });

    const graph = buildSoftwareGraph(scan);
    const evidence = graph.evidence[0];
    const node = graph.nodes.find((n) => n.kind === "service");

    expect(evidence.excerpt.endsWith("…")).toBe(true);
    expect(evidence.excerpt.length).toBeLessThanOrEqual(201);
    expect(node?.metadata.apiKey).toBeUndefined();
    expect(node?.metadata.safeField).toBe("ok");
    expect((node?.metadata.headers as string[])[0]).not.toContain("sk-");
    expect((node?.metadata.headers as string[])[0]).toContain("***");
  });

  it("rejects invalid scan input", () => {
    const scan = makeScan({ projectId: "" });
    expect(() => buildSoftwareGraph(scan)).toThrow("Invalid RawBlueprintScan");
  });

  it("marks condensed and truncates when limits exceeded", () => {
    const routes = Array.from({ length: 3000 }, (_, i) => ({
      id: `route:${i}`,
      method: "get",
      path: `/route/${i}`,
      filePath: `src/routes/route${i}.ts`,
      line: 1,
    }));
    const scan = makeScan({ filesAnalyzed: 3000, routes });
    const graph = buildSoftwareGraph(scan);

    expect(graph.condensed).toBe(true);
    expect(graph.nodes.length).toBeLessThanOrEqual(2500);
    expect(graph.edges.length).toBeLessThanOrEqual(5000);
    expect(graph.metrics.find((m) => m.name === "nodeCount")?.value).toBeGreaterThan(2500);
  });
});
