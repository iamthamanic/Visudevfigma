/**
 * Tests for EvolutionView empty state and snapshot selectors.
 */

import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { EvolutionView } from "./EvolutionView";
import type { BlueprintData } from "../types";

const graphWithSnapshots: BlueprintData = {
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
      { id: "a", kind: "file", label: "a.ts", metadata: {} },
      { id: "b", kind: "file", label: "b.ts", metadata: {} },
    ],
    edges: [],
    evidence: [],
    groups: [],
    metrics: [],
    condensed: false,
    limits: { maxNodes: 2500, maxEdges: 5000 },
    snapshots: [
      {
        id: "s1",
        label: "scan-1",
        ref: "scan-1",
        capturedAt: "2026-01-01T00:00:00.000Z",
        nodeIds: ["a"],
        nodeSignatures: { a: "file:a.ts" },
      },
      {
        id: "s2",
        label: "scan-2",
        ref: "scan-2",
        capturedAt: "2026-01-02T00:00:00.000Z",
        nodeIds: ["a", "b"],
        nodeSignatures: { a: "file:a.ts", b: "file:b.ts" },
      },
    ],
  },
};

describe("EvolutionView", () => {
  it("shows empty state without graph", () => {
    render(
      <EvolutionView
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
    expect(screen.getByText("Keine Evolution-Daten")).toBeInTheDocument();
  });

  it("renders snapshot compare controls", () => {
    render(<EvolutionView blueprint={graphWithSnapshots} />);
    expect(screen.getByLabelText("Basis")).toBeInTheDocument();
    expect(screen.getByLabelText("Ziel")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Timeline" })).toBeInTheDocument();
    expect(screen.getAllByText("scan-1").length).toBeGreaterThan(0);
    expect(screen.getAllByText("scan-2").length).toBeGreaterThan(0);
  });
});
