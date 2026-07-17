import { describe, expect, it } from "vitest";
import type { SoftwareGraph } from "../../../../shared/software-graph.types.js";
import { analyzeApplicationChain } from "./app-chain-analyzer.service.js";

function graphFixture(overrides?: Partial<SoftwareGraph>): SoftwareGraph {
  const base: SoftwareGraph = {
    version: 1,
    projectId: "p1",
    analyzedAt: "2026-07-17T00:00:00.000Z",
    scopes: [],
    nodes: [
      { id: "route:r1", kind: "route", label: "GET /employees", metadata: {} },
      { id: "svc:auth", kind: "service", label: "requireAuth", metadata: {} },
      { id: "repo:emp", kind: "repository", label: "EmployeeRepo", metadata: {} },
      { id: "table:emp", kind: "table", label: "employees", metadata: {} },
    ],
    edges: [
      {
        id: "e1",
        kind: "authenticates",
        sourceId: "route:r1",
        targetId: "svc:auth",
        metadata: {},
      },
      {
        id: "e2",
        kind: "calls",
        sourceId: "route:r1",
        targetId: "repo:emp",
        metadata: {},
      },
      {
        id: "e3",
        kind: "data",
        sourceId: "repo:emp",
        targetId: "table:emp",
        metadata: {},
      },
    ],
    evidence: [
      {
        id: "ev1",
        factId: "f1",
        kind: "auth-check",
        filePath: "src/middleware/auth.ts",
        line: 10,
        excerpt: "requireAuth(session)",
        nodeId: "svc:auth",
      },
      {
        id: "ev2",
        factId: "f2",
        kind: "repo-read",
        filePath: "src/repos/employee.ts",
        line: 20,
        excerpt: "findMany({ where: { tenant_id: ctx.tenantId } })",
        nodeId: "repo:emp",
      },
    ],
    groups: [],
    metrics: [],
    condensed: false,
    limits: { maxNodes: 500, maxEdges: 2000 },
  };
  return { ...base, ...overrides };
}

describe("analyzeApplicationChain", () => {
  it("marks auth and tenant isolation protected when middleware + tenant filter exist", () => {
    const findings = analyzeApplicationChain({ graph: graphFixture() });
    const auth = findings.find((f) => f.control === "authentication");
    const tenant = findings.find((f) => f.control === "tenant-isolation");
    expect(auth?.status).toBe("protected");
    expect(tenant?.status).toBe("protected");
    expect(tenant?.mechanisms.some((m) => m.kind === "tenant-filter")).toBe(true);
    expect(tenant?.enforcementLayers).toContain("repository");
  });

  it("flags bypass when unscoped DB query is evidenced", () => {
    const graph = graphFixture({
      evidence: [
        {
          id: "ev-bypass",
          factId: "fb",
          kind: "db-read",
          filePath: "src/repos/employee.ts",
          line: 40,
          excerpt: 'db.collection("employees").find({})',
          nodeId: "repo:emp",
        },
      ],
    });
    const findings = analyzeApplicationChain({ graph });
    const tenant = findings.find((f) => f.control === "tenant-isolation");
    const scope = findings.find((f) => f.control === "resource-scope");
    expect(tenant?.status).toBe("missing");
    expect(tenant?.warning).toMatch(/bypass|without tenant/i);
    expect(scope?.status).toBe("partial");
  });

  it("returns not-applicable tenant control when route never touches data", () => {
    const graph = graphFixture({
      nodes: [{ id: "route:health", kind: "route", label: "GET /health", metadata: {} }],
      edges: [],
      evidence: [],
    });
    const findings = analyzeApplicationChain({ graph });
    const tenant = findings.find((f) => f.control === "tenant-isolation");
    expect(tenant?.status).toBe("not-applicable");
  });
});
