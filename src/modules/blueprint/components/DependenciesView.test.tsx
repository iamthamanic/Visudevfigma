/**
 * Tests for DependenciesView empty state and edge filters.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DependenciesView } from "./DependenciesView";
import type { BlueprintData } from "../types";

const emptyBlueprint: BlueprintData = {
  version: 1,
  routes: [],
  securityMatrix: [],
  findings: [],
  facts: [],
  filesAnalyzed: 0,
};

const graphBlueprint: BlueprintData = {
  ...emptyBlueprint,
  graph: {
    version: 1,
    projectId: "p1",
    analyzedAt: "2026-01-01T00:00:00.000Z",
    scopes: [],
    nodes: [
      { id: "file:a", kind: "file", label: "a.ts", metadata: {} },
      { id: "file:b", kind: "file", label: "b.ts", metadata: {} },
    ],
    edges: [
      {
        id: "e-import",
        kind: "imports",
        sourceId: "file:a",
        targetId: "file:b",
        metadata: { evidenceFactId: "fact-1" },
      },
      {
        id: "e-call",
        kind: "calls",
        sourceId: "file:b",
        targetId: "file:a",
        metadata: { evidenceFactId: "fact-2" },
      },
    ],
    evidence: [
      {
        id: "ev-1",
        factId: "fact-1",
        kind: "ast-import",
        filePath: "src/a.ts",
        line: 1,
        excerpt: "import './b'",
      },
    ],
    groups: [],
    metrics: [],
    condensed: false,
    limits: { maxNodes: 2500, maxEdges: 5000 },
  },
};

describe("DependenciesView", () => {
  it("shows empty state without graph", () => {
    render(<DependenciesView blueprint={emptyBlueprint} />);
    expect(screen.getByText("Keine Abhängigkeits-Daten")).toBeInTheDocument();
  });

  it("renders edge kind filter controls", () => {
    render(<DependenciesView blueprint={graphBlueprint} />);
    expect(screen.getByLabelText("Import")).toBeInTheDocument();
    expect(screen.getByLabelText("Call")).toBeInTheDocument();
    expect(screen.getByLabelText("API")).toBeInTheDocument();
  });

  it("shows empty canvas message when all edge filters are off", () => {
    render(<DependenciesView blueprint={graphBlueprint} />);
    for (const kind of ["Import", "Call", "API", "Event", "Data"]) {
      const checkbox = screen.getByLabelText(kind);
      if (checkbox instanceof HTMLInputElement && checkbox.checked) {
        fireEvent.click(checkbox);
      }
    }
    expect(screen.getByText(/Passe die Kantenfilter an/i)).toBeInTheDocument();
  });
});
