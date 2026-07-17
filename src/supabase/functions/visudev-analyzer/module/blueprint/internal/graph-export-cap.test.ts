/** Tests for VisuDevGraph export sanitization and boundary coercion. */

import { assertEquals } from "std/assert";
import type { VisuDevGraph } from "../../dto/graph/visudev-graph.dto.ts";
import {
  capGraphForExport,
  selectFactsPreservingPrismaModels,
} from "./graph-export-cap.ts";
import { repairGraphReferences } from "./graph-export-integrity.ts";
import { sanitizeGraphForExport } from "./graph-export-sanitize.ts";

const baseGraph = (): VisuDevGraph => ({
  version: 1,
  evidence: [{
    id: "ev-1",
    factId: "fact-1",
    subjectType: "node",
    subjectId: "node-1",
    filePath: "routes/a.ts",
    line: 1,
    snippet: "code",
    summary: "summary",
  }],
  nodes: [{
    id: "node-1",
    kind: "route",
    label: "GET /api/items",
    state: "confirmed",
    evidenceIds: ["ev-1"],
    scopeId: "GET /api/items",
  }],
  edges: [{
    id: "edge-1",
    fromNodeId: "node-1",
    toNodeId: "node-1",
    kind: "reads",
    state: "confirmed",
    evidenceIds: ["ev-1"],
    scopeId: "GET /api/items",
  }],
  scopes: [{
    id: "GET /api/items",
    kind: "route",
    label: "GET /api/items",
    nodeIds: ["node-1"],
    edgeIds: ["edge-1"],
  }],
  findings: [],
});

Deno.test("sanitizeGraphForExport remaps scope nodeIds and edgeIds with node ids", () => {
  const longNodeId =
    "node-with-very-long-id-that-will-be-truncated-or-redacted-for-export-boundary-check";
  const graph: VisuDevGraph = {
    ...baseGraph(),
    evidence: [{
      ...baseGraph().evidence[0],
      subjectId: longNodeId,
    }],
    nodes: [{
      ...baseGraph().nodes[0],
      id: longNodeId,
      evidenceIds: ["ev-1"],
    }],
    edges: [{
      ...baseGraph().edges[0],
      id: "edge-1",
      fromNodeId: longNodeId,
      toNodeId: longNodeId,
    }],
    scopes: [{
      ...baseGraph().scopes[0],
      nodeIds: [longNodeId],
      edgeIds: ["edge-1"],
    }],
  };

  const sanitized = sanitizeGraphForExport(graph);
  const remappedNodeId = sanitized.nodes[0].id;
  assertEquals(remappedNodeId.length <= 80, true);
  assertEquals(sanitized.scopes[0].nodeIds, [remappedNodeId]);
  assertEquals(sanitized.edges[0].fromNodeId, remappedNodeId);
  assertEquals(sanitized.evidence[0].subjectId.length <= 120, true);
});

Deno.test("capGraphForExport returns empty graph for malformed input", () => {
  const result = capGraphForExport(null);
  assertEquals(result, {
    version: 1,
    nodes: [],
    edges: [],
    evidence: [],
    scopes: [],
    findings: [],
  });
});

Deno.test("coerceVisuDevGraphInput keeps valid nodes when evidence is malformed", () => {
  const result = capGraphForExport({
    version: 1,
    nodes: baseGraph().nodes,
    edges: [],
    evidence: [{ id: "", factId: "x" }],
    scopes: [],
    findings: [],
  });
  assertEquals(result.nodes.length, 1);
  assertEquals(result.evidence.length, 1);
  assertEquals(result.evidence[0].factId, "fact-fallback-1");
});

Deno.test("sanitizeGraphForExport avoids id collisions after truncation", () => {
  const prefix = "node-";
  const graph: VisuDevGraph = {
    version: 1,
    evidence: [],
    nodes: [
      {
        id: `${prefix}${"a".repeat(90)}`,
        kind: "route",
        label: "GET /a",
        state: "confirmed",
        evidenceIds: [],
      },
      {
        id: `${prefix}${"b".repeat(90)}`,
        kind: "route",
        label: "GET /b",
        state: "confirmed",
        evidenceIds: [],
      },
    ],
    edges: [],
    scopes: [],
    findings: [],
  };
  const sanitized = sanitizeGraphForExport(graph);
  assertEquals(sanitized.nodes[0].id !== sanitized.nodes[1].id, true);
});

Deno.test("repairGraphReferences drops edges with missing nodes", () => {
  const graph = baseGraph();
  graph.edges[0].fromNodeId = "missing-node";
  const repaired = repairGraphReferences(graph);
  assertEquals(repaired.edges.length, 0);
  assertEquals(repaired.scopes[0].edgeIds.length, 0);
});

Deno.test("capGraphForExport accepts unknown and validates output", () => {
  const result = capGraphForExport(baseGraph());
  assertEquals(result.version, 1);
  assertEquals(result.nodes.length, 1);
  assertEquals(result.scopes[0].nodeIds, result.nodes.map((node) => node.id));
});

import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";

function modelFact(table: string, line: number): CodeFact {
  return {
    id: `m-${table}`,
    kind: "db-write",
    filePath: "packages/database/schema.prisma",
    line,
    snippet: `model ${table} {`,
    metadata: { table, operation: "prisma-model", framework: "prisma" },
  };
}

function routeFact(i: number): CodeFact {
  return {
    id: `r-${i}`,
    kind: "api-route",
    filePath: `apps/web/app/api/r${i}/route.ts`,
    line: 1,
    snippet: `export async function GET() {}`,
    metadata: { method: "GET", path: `/api/r${i}` },
  };
}

Deno.test("selectFactsPreservingPrismaModels keeps all schema models under cap flood", () => {
  const models = Array.from(
    { length: 80 },
    (_, i) => modelFact(`Model${i}`, i + 1),
  );
  const routes = Array.from({ length: 400 }, (_, i) => routeFact(i));
  const selected = selectFactsPreservingPrismaModels(
    [...routes, ...models],
    100,
  );
  const keptModels = selected.filter((f) =>
    f.metadata?.operation === "prisma-model"
  );
  assertEquals(keptModels.length, 80);
  assertEquals(selected.some((f) => f.metadata?.table === "Model79"), true);
});

Deno.test("selectFactsPreservingPrismaModels keeps LeaveRequest among many models", () => {
  const models = [
    ...Array.from({ length: 40 }, (_, i) => modelFact(`Other${i}`, i + 1)),
    modelFact("LeaveRequest", 99),
  ];
  const noise = Array.from({ length: 200 }, (_, i) => routeFact(i));
  const selected = selectFactsPreservingPrismaModels([...noise, ...models], 50);
  assertEquals(
    selected.some((f) => f.metadata?.table === "LeaveRequest"),
    true,
  );
});

Deno.test("selectFactsPreservingPrismaModels keeps infra-service past route flood (P3-2b)", () => {
  const infra: CodeFact = {
    id: "fact-compose-redis",
    kind: "infra-service",
    filePath: "docker-compose.yml",
    line: 12,
    snippet: 'image: redis:7-alpine',
    metadata: { service: "Redis", source: "docker-compose", framework: "docker-compose" },
  };
  const noise = Array.from({ length: 400 }, (_, i) => routeFact(i));
  const selected = selectFactsPreservingPrismaModels([...noise, infra], 50);
  assertEquals(
    selected.some((f) => f.kind === "infra-service" && f.metadata?.service === "Redis"),
    true,
  );
});
