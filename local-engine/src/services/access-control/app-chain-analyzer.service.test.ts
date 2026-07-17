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

  it("does not mark resource-scope protected from repository reachability alone", () => {
    const graph = graphFixture({
      evidence: [
        {
          id: "ev-auth",
          factId: "fa",
          kind: "auth-check",
          filePath: "src/middleware/auth.ts",
          line: 10,
          excerpt: "requireAuth(session)",
          nodeId: "svc:auth",
        },
        {
          id: "ev-repo",
          factId: "fr",
          kind: "repo-read",
          filePath: "src/repos/employee.ts",
          line: 20,
          excerpt: "findMany()",
          nodeId: "repo:emp",
        },
      ],
    });
    const findings = analyzeApplicationChain({ graph });
    const scope = findings.find((f) => f.control === "resource-scope");
    expect(scope?.status).toBe("missing");
  });

  it("bridges file-scoped leave authenticates/validates/leave-route-db-fact into AC v2", () => {
    // Mirrors browo-hr / legacy securityMatrix: edges hang off the file node, not the route.
    const graph: SoftwareGraph = {
      version: 1,
      projectId: "browo",
      analyzedAt: "2026-07-17T00:00:00.000Z",
      scopes: [],
      nodes: [
        {
          id: "file:leaves",
          kind: "file",
          label: "leaves.routes.ts",
          filePath: "app/modules/leaves/leaves.routes.ts",
          metadata: {},
        },
        {
          id: "route:leave",
          kind: "route",
          label: "GET /api/leaves",
          filePath: "app/modules/leaves/leaves.routes.ts",
          line: 62,
          scopeId: "file:leaves",
          metadata: {
            routeId: "legacy-route-180",
            method: "GET",
            path: "/api/leaves",
          },
        },
        {
          id: "svc:auth",
          kind: "service",
          label: "auth-check",
          filePath: "app/modules/leaves/leaves.routes.ts",
          line: 62,
          metadata: {},
        },
        {
          id: "svc:val",
          kind: "service",
          label: "schema-safe-parse",
          filePath: "app/modules/leaves/leaves.routes.ts",
          line: 63,
          metadata: {},
        },
        {
          id: "table:leave",
          kind: "table",
          label: "leaveRequest",
          filePath: "prisma/schema.prisma",
          line: 40,
          metadata: {},
        },
      ],
      edges: [
        {
          id: "e-auth",
          kind: "authenticates",
          sourceId: "file:leaves",
          targetId: "svc:auth",
          metadata: { evidenceFactId: "fact-auth" },
        },
        {
          id: "e-val",
          kind: "validates",
          sourceId: "file:leaves",
          targetId: "svc:val",
          metadata: { evidenceFactId: "fact-val" },
        },
        {
          id: "e-db",
          kind: "data",
          sourceId: "file:leaves",
          targetId: "table:leave",
          metadata: { reason: "leave-route-db-fact" },
        },
      ],
      evidence: [
        {
          id: "ev-auth",
          factId: "fact-auth",
          kind: "auth-check",
          filePath: "app/modules/leaves/leaves.routes.ts",
          line: 62,
          excerpt: "authorize('hr.calendar.leave.request')",
        },
        {
          id: "ev-val",
          factId: "fact-val",
          kind: "schema-safe-parse",
          filePath: "app/modules/leaves/leaves.routes.ts",
          line: 63,
          excerpt: "LeaveRequestSchema.safeParse(body)",
        },
      ],
      groups: [],
      metrics: [],
      condensed: false,
      limits: { maxNodes: 500, maxEdges: 2000 },
    };

    const findings = analyzeApplicationChain({ graph });
    const byControl = (control: string) =>
      findings.find((f) => f.resourceId === "legacy-route-180" && f.control === control);

    const auth = byControl("authentication");
    const authz = byControl("authorization");
    const validation = byControl("validation");
    const tenant = byControl("tenant-isolation");
    const scope = byControl("resource-scope");

    expect(auth?.status).toBe("protected");
    expect(auth?.mechanisms.length).toBeGreaterThan(0);
    expect(auth?.evidence.length).toBeGreaterThan(0);
    expect(auth?.evidence.some((e) => /authorize/i.test(e.excerpt))).toBe(true);

    expect(authz?.status).toBe("protected");
    expect(authz?.evidence.length).toBeGreaterThan(0);

    expect(validation?.status).toBe("protected");
    expect(validation?.evidence.length).toBeGreaterThan(0);

    // leave-route-db-fact ⇒ touches data (not stuck at not-applicable); no tenant filter ⇒ missing
    expect(tenant?.status).not.toBe("not-applicable");
    expect(tenant?.status).toBe("missing");
    expect(scope?.status).toBe("missing");
    expect(scope?.evidence.some((e) => e.kind === "leave-route-db-fact")).toBe(true);
  });

  it("does not invent protected auth when leave file has no authenticates edge", () => {
    const graph: SoftwareGraph = {
      version: 1,
      projectId: "browo",
      analyzedAt: "2026-07-17T00:00:00.000Z",
      scopes: [],
      nodes: [
        {
          id: "file:leaves",
          kind: "file",
          label: "leaves.routes.ts",
          filePath: "app/modules/leaves/leaves.routes.ts",
          metadata: {},
        },
        {
          id: "route:leave",
          kind: "route",
          label: "GET /api/leaves",
          filePath: "app/modules/leaves/leaves.routes.ts",
          line: 10,
          scopeId: "file:leaves",
          metadata: { routeId: "r-leave", method: "GET", path: "/api/leaves" },
        },
      ],
      edges: [],
      evidence: [],
      groups: [],
      metrics: [],
      condensed: false,
      limits: { maxNodes: 500, maxEdges: 2000 },
    };
    const findings = analyzeApplicationChain({ graph });
    const auth = findings.find((f) => f.control === "authentication");
    expect(auth?.status).toBe("unverified");
    expect(auth?.mechanisms).toEqual([]);
    expect(auth?.evidence).toEqual([]);
  });
});
