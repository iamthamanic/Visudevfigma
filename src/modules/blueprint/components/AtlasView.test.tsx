/**
 * Tests for AtlasView empty state and search controls.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AtlasView } from "./AtlasView";
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
      { id: "m1", kind: "module", label: "auth", metadata: {} },
      { id: "m2", kind: "module", label: "billing", metadata: {} },
    ],
    edges: [{ id: "e1", kind: "references", sourceId: "m1", targetId: "m2", metadata: {} }],
    evidence: [],
    groups: [],
    metrics: [],
    condensed: false,
    limits: { maxNodes: 2500, maxEdges: 5000 },
  },
};

describe("AtlasView", () => {
  it("shows empty state without graph", () => {
    render(
      <AtlasView
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
    expect(screen.getByText("Keine Atlas-Daten")).toBeInTheDocument();
  });

  it("renders search and overview stats", () => {
    render(<AtlasView blueprint={graphBlueprint} />);
    expect(screen.getByText(/2 von 2 Knoten sichtbar/)).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("Label durchsuchen…"), {
      target: { value: "bill" },
    });
    expect(screen.getByText(/1 von 2 Knoten sichtbar/)).toBeInTheDocument();
  });
});
