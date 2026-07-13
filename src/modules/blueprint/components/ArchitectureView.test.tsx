/**
 * Tests for ArchitectureView empty state and controls.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { ArchitectureView } from "./ArchitectureView";
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
      { id: "domain:routes", kind: "domain", label: "routes", metadata: {} },
      { id: "layer:routes:presentation", kind: "layer", label: "presentation", metadata: {} },
      {
        id: "module:routes:presentation:routes",
        kind: "module",
        label: "routes",
        metadata: {},
      },
    ],
    edges: [
      {
        id: "e1",
        kind: "contains",
        sourceId: "domain:routes",
        targetId: "layer:routes:presentation",
        metadata: {},
      },
      {
        id: "e2",
        kind: "contains",
        sourceId: "layer:routes:presentation",
        targetId: "module:routes:presentation:routes",
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

describe("ArchitectureView", () => {
  it("shows empty state without graph data", () => {
    render(<ArchitectureView blueprint={emptyBlueprint} />);
    expect(screen.getByText("Keine Architektur-Daten")).toBeInTheDocument();
  });

  it("renders collapse controls for domains and modules", () => {
    render(<ArchitectureView blueprint={graphBlueprint} />);
    expect(screen.getByRole("button", { name: /domain routes/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /module routes/i })).toBeInTheDocument();
  });

  it("toggles domain collapse on click", () => {
    render(<ArchitectureView blueprint={graphBlueprint} />);
    const domainButton = screen.getByRole("button", { name: /domain routes/i });
    expect(domainButton).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(domainButton);
    expect(domainButton).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps filter controls when all kinds are hidden", () => {
    render(<ArchitectureView blueprint={graphBlueprint} />);
    for (const kind of [
      "Domain",
      "Layer",
      "Module",
      "Route",
      "Service",
      "Repository",
      "Table",
      "File",
    ]) {
      const checkbox = screen.getByLabelText(kind);
      if (checkbox instanceof HTMLInputElement && checkbox.checked) {
        fireEvent.click(checkbox);
      }
    }
    expect(screen.getByText(/Keine sichtbaren Knoten/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Filter zurücksetzen/i })).toBeInTheDocument();
  });
});
