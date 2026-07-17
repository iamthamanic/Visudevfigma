import { describe, expect, it } from "vitest";
import { deriveDiagnosticsFromGraph } from "./software-graph-projections";
import type { SoftwareGraph } from "./software-graph-types";

describe("deriveDiagnosticsFromGraph", () => {
  it("derives routes, matrix, findings and facts from graph evidence", () => {
    const graph: SoftwareGraph = {
      version: 1,
      projectId: "p1",
      analyzedAt: "2026-01-01T00:00:00.000Z",
      scopes: [],
      nodes: [
        {
          id: "route:1",
          kind: "route",
          label: "POST /api/employees",
          filePath: "/api/employees.ts",
          line: 10,
          metadata: { routeId: "r1", method: "POST", path: "/api/employees", pipelineCount: 0 },
        },
      ],
      edges: [],
      evidence: [
        {
          id: "ev1",
          factId: "fact-1",
          kind: "code:snippet",
          filePath: "/api/employees.ts",
          line: 12,
          excerpt: "export const handler = () => {}",
        },
      ],
      groups: [],
      metrics: [],
      condensed: false,
      limits: { maxNodes: 2500, maxEdges: 5000 },
    };

    const derived = deriveDiagnosticsFromGraph(graph);
    expect(derived.routes).toHaveLength(1);
    expect(derived.securityMatrix).toHaveLength(1);
    expect(derived.facts).toHaveLength(1);
    expect(derived.findings.length).toBeGreaterThanOrEqual(1);
    expect(derived.securityMatrix[0]?.auth.state).toBe("missing");
    expect(derived.securityMatrix[0]?.validation.state).toBe("missing");
    expect(derived.securityMatrix[0]?.findingCount).toBeGreaterThanOrEqual(1);
  });

  it("maps authenticates/validates/data edges into matrix cells (not all ?)", () => {
    const graph: SoftwareGraph = {
      version: 1,
      projectId: "browo",
      analyzedAt: "2026-01-01T00:00:00.000Z",
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
          id: "route:1",
          kind: "route",
          label: "POST /api/leaves",
          filePath: "app/modules/leaves/leaves.routes.ts",
          line: 62,
          metadata: {
            routeId: "POST /api/leaves",
            method: "POST",
            path: "/api/leaves",
            pipelineCount: 0,
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
          id: "file:service",
          kind: "file",
          label: "leaves.service.ts",
          filePath: "app/modules/leaves/leaves.service.ts",
          metadata: {},
        },
        {
          id: "table:leave",
          kind: "table",
          label: "leaveRequest",
          filePath: "app/modules/leaves/leaves.service.ts",
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
          sourceId: "file:service",
          targetId: "table:leave",
          metadata: { evidenceFactId: "fact-db" },
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
        {
          id: "ev-db",
          factId: "fact-db",
          kind: "db-write",
          filePath: "app/modules/leaves/leaves.service.ts",
          line: 40,
          excerpt: "this.prisma.leaveRequest.create({})",
        },
      ],
      groups: [],
      metrics: [],
      condensed: false,
      limits: { maxNodes: 2500, maxEdges: 5000 },
    };

    const derived = deriveDiagnosticsFromGraph(graph);
    expect(derived.securityMatrix).toHaveLength(1);
    expect(derived.securityMatrix[0]?.auth.state).toBe("confirmed");
    expect(derived.securityMatrix[0]?.validation.state).toBe("confirmed");
    expect(derived.securityMatrix[0]?.role.state).toBe("confirmed");
    expect(derived.securityMatrix[0]?.db.state).toBe("confirmed");
  });

  it("sets ROLE confirmed from Django permission_classes evidence", () => {
    const graph: SoftwareGraph = {
      version: 1,
      projectId: "plane",
      analyzedAt: "2026-01-01T00:00:00.000Z",
      scopes: [],
      nodes: [
        {
          id: "route:ws",
          kind: "route",
          label: "ALL /api/workspaces/",
          filePath: "apps/api/plane/urls.py",
          line: 10,
          metadata: {
            routeId: "ALL /api/workspaces/",
            method: "ALL",
            path: "/api/workspaces/",
            pipelineCount: 0,
          },
        },
      ],
      edges: [],
      evidence: [
        {
          id: "ev-perm",
          factId: "fact-perm",
          kind: "auth-check",
          filePath: "apps/api/plane/urls.py",
          line: 20,
          excerpt: "permission_classes = [IsAuthenticated]",
        },
      ],
      groups: [],
      metrics: [],
      condensed: false,
      limits: { maxNodes: 2500, maxEdges: 5000 },
    };

    const derived = deriveDiagnosticsFromGraph(graph);
    expect(derived.securityMatrix[0]?.auth.state).toBe("confirmed");
    expect(derived.securityMatrix[0]?.role.state).toBe("confirmed");
  });

  it("confirms db from leave-route-db-fact edges even with many routes in one file", () => {
    const graph: SoftwareGraph = {
      version: 1,
      projectId: "browo",
      analyzedAt: "2026-01-01T00:00:00.000Z",
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
          id: "route:list",
          kind: "route",
          label: "GET /api/leaves",
          filePath: "app/modules/leaves/leaves.routes.ts",
          line: 10,
          metadata: {
            routeId: "GET /api/leaves",
            method: "GET",
            path: "/api/leaves",
            pipelineCount: 0,
          },
        },
        {
          id: "route:create",
          kind: "route",
          label: "POST /api/leaves",
          filePath: "app/modules/leaves/leaves.routes.ts",
          line: 40,
          metadata: {
            routeId: "POST /api/leaves",
            method: "POST",
            path: "/api/leaves",
            pipelineCount: 0,
          },
        },
        {
          id: "table:prisma:LeaveRequest",
          kind: "table",
          label: "LeaveRequest",
          filePath: "prisma/schema.prisma",
          metadata: {},
        },
      ],
      edges: [
        {
          id: "e-leave-db",
          kind: "data",
          sourceId: "file:leaves",
          targetId: "table:prisma:LeaveRequest",
          metadata: { reason: "leave-route-db-fact" },
        },
      ],
      evidence: [],
      groups: [],
      metrics: [],
      condensed: false,
      limits: { maxNodes: 2500, maxEdges: 5000 },
    };

    const derived = deriveDiagnosticsFromGraph(graph);
    expect(derived.securityMatrix).toHaveLength(2);
    expect(derived.securityMatrix.every((row) => row.db.state === "confirmed")).toBe(true);
  });

  it("confirms db from execution group table steps when leave edges were condensed away", () => {
    const graph: SoftwareGraph = {
      version: 1,
      projectId: "browo",
      analyzedAt: "2026-01-01T00:00:00.000Z",
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
          id: "route:list",
          kind: "route",
          label: "GET /api/leaves",
          filePath: "app/modules/leaves/leaves.routes.ts",
          line: 10,
          metadata: {
            routeId: "legacy-route-180",
            method: "GET",
            path: "/api/leaves",
            pipelineCount: 0,
          },
        },
        {
          id: "table:prisma:LeaveRequest",
          kind: "table",
          label: "LeaveRequest",
          filePath: "prisma/schema.prisma",
          metadata: {},
        },
      ],
      edges: [],
      evidence: [],
      groups: [
        {
          id: "execution:legacy-route-180:0",
          kind: "route",
          label: "GET /api/leaves · path 1",
          nodeIds: ["route:list", "file:leaves", "table:prisma:LeaveRequest"],
        },
      ],
      metrics: [],
      condensed: true,
      limits: { maxNodes: 2500, maxEdges: 5000 },
    };

    const derived = deriveDiagnosticsFromGraph(graph);
    expect(derived.securityMatrix).toHaveLength(1);
    expect(derived.securityMatrix[0]?.db.state).toBe("confirmed");
  });

  it("keeps db unknown without table edges or execution table steps", () => {
    const graph: SoftwareGraph = {
      version: 1,
      projectId: "browo",
      analyzedAt: "2026-01-01T00:00:00.000Z",
      scopes: [],
      nodes: [
        {
          id: "route:health",
          kind: "route",
          label: "GET /health",
          filePath: "app/health.ts",
          line: 1,
          metadata: {
            routeId: "GET /health",
            method: "GET",
            path: "/health",
            pipelineCount: 0,
          },
        },
      ],
      edges: [],
      evidence: [],
      groups: [
        {
          id: "execution:GET /health:0",
          kind: "route",
          label: "GET /health · path 1",
          nodeIds: ["route:health"],
        },
      ],
      metrics: [],
      condensed: false,
      limits: { maxNodes: 2500, maxEdges: 5000 },
    };

    const derived = deriveDiagnosticsFromGraph(graph);
    expect(derived.securityMatrix[0]?.db.state).toBe("unknown");
  });
});
