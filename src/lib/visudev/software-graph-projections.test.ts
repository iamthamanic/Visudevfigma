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
});
