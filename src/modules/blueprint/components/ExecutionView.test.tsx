/**
 * Tests for ExecutionView route selection and step list.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ExecutionView } from "./ExecutionView";
import type { BlueprintData } from "../types";

const graphBlueprint: BlueprintData = {
  version: 1,
  routes: [],
  securityMatrix: [],
  findings: [],
  facts: [],
  filesAnalyzed: 0,
  graph: {
    version: 1,
    projectId: "p1",
    analyzedAt: "2026-01-01T00:00:00.000Z",
    scopes: [],
    nodes: [
      {
        id: "route:users:get",
        kind: "route",
        label: "GET /users",
        scopeId: "file:handler",
        filePath: "src/routes/users.ts",
        line: 10,
        metadata: { routeId: "route:users:get" },
      },
      {
        id: "file:handler",
        kind: "file",
        label: "users.ts",
        filePath: "src/routes/users.ts",
        line: 10,
        metadata: {},
      },
    ],
    edges: [],
    evidence: [
      {
        id: "ev-1",
        factId: "fact-1",
        kind: "autoguide:auth",
        filePath: "src/routes/users.ts",
        line: 10,
        excerpt: "requireAuth()",
      },
    ],
    groups: [
      {
        id: "execution:route:users:get:0",
        kind: "route",
        label: "GET /users · path 1",
        nodeIds: ["route:users:get", "file:handler"],
      },
    ],
    metrics: [],
    condensed: false,
    limits: { maxNodes: 2500, maxEdges: 5000 },
  },
};

describe("ExecutionView", () => {
  it("shows empty state without graph", () => {
    render(
      <ExecutionView
        blueprint={{
          version: 1,
          routes: [],
          securityMatrix: [],
          findings: [],
          facts: [],
          filesAnalyzed: 0,
        }}
      />,
    );
    expect(screen.getByText("Keine Execution-Daten")).toBeInTheDocument();
  });

  it("lists pipeline steps for selected route", () => {
    render(<ExecutionView blueprint={graphBlueprint} />);
    expect(screen.getByRole("button", { name: /Route GET \/users/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Handler users\.ts/i }));
    expect(screen.getByText(/requireAuth/i)).toBeInTheDocument();
  });
});
