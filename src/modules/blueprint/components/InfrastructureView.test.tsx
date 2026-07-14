/** Vitest smoke for card selection → Inspektor sections (no Cytoscape mount). */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { InfrastructureView } from "./InfrastructureView";
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
        id: "svc:api",
        kind: "service",
        label: "API Service",
        metadata: {},
      },
      {
        id: "tbl:users",
        kind: "table",
        label: "PostgreSQL",
        metadata: {},
      },
    ],
    edges: [
      {
        id: "e-data",
        kind: "data",
        sourceId: "svc:api",
        targetId: "tbl:users",
        metadata: {},
      },
    ],
    evidence: [],
    groups: [],
    metrics: [],
    condensed: false,
    limits: { maxNodes: 2500, maxEdges: 5000 },
  },
};

describe("InfrastructureView", () => {
  it("shows empty state without graph nodes", () => {
    render(
      <InfrastructureView
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
    expect(screen.getByText("Keine Infrastruktur-Daten")).toBeInTheDocument();
  });

  it("lists services and opens inspector on selection", () => {
    render(<InfrastructureView blueprint={graphBlueprint} />);
    fireEvent.click(screen.getByRole("button", { name: /API Service/i }));
    expect(screen.getByText("Ressourcen")).toBeInTheDocument();
    expect(screen.getByText(/Keine Ressourcen-Metriken/i)).toBeInTheDocument();
    expect(screen.getByText("Verantwortlichkeiten")).toBeInTheDocument();
  });
});
