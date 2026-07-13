/**
 * Tests for BlueprintViewShell tab navigation.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { BlueprintViewShell } from "./BlueprintViewShell";
import type { BlueprintData } from "../types";

const emptyBlueprint: BlueprintData = {
  version: 1,
  routes: [],
  securityMatrix: [],
  findings: [],
  facts: [],
  filesAnalyzed: 0,
};

describe("BlueprintViewShell", () => {
  it("renders Phase 1 view tabs", () => {
    render(<BlueprintViewShell blueprint={emptyBlueprint} />);
    expect(screen.getByRole("tab", { name: "Infrastructure" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Diagnostics" })).toBeInTheDocument();
  });

  it("defaults to Infrastructure per Phase 1 acceptance", () => {
    render(<BlueprintViewShell blueprint={emptyBlueprint} />);
    expect(screen.getByRole("tab", { name: "Infrastructure" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("defaults to Infrastructure when graph data exists", () => {
    render(
      <BlueprintViewShell
        blueprint={{
          ...emptyBlueprint,
          graph: {
            version: 1,
            projectId: "p1",
            analyzedAt: "2026-01-01T00:00:00.000Z",
            scopes: [],
            nodes: [{ id: "n1", kind: "service", label: "API", metadata: {} }],
            edges: [],
            evidence: [],
            groups: [],
            metrics: [],
            condensed: false,
            limits: { maxNodes: 2500, maxEdges: 5000 },
          },
        }}
      />,
    );
    expect(screen.getByRole("tab", { name: "Infrastructure" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("switches to Diagnostics tab on click", () => {
    render(<BlueprintViewShell blueprint={emptyBlueprint} />);
    fireEvent.click(screen.getByRole("tab", { name: "Diagnostics" }));
    expect(screen.getByRole("tab", { name: "Diagnostics" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "Infrastructure" })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });
});
