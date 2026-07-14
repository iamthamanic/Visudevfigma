/**
 * Vitest smoke for Diagnostics sub-tabs, matrix, and Problem-Inspektor selection.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { DiagnosticsView } from "./DiagnosticsView";
import type { BlueprintData } from "../types";

const blueprint: BlueprintData = {
  version: 1,
  filesAnalyzed: 1,
  routes: [
    {
      id: "route-1",
      method: "GET",
      path: "/users",
      filePath: "src/routes/users.ts",
      line: 10,
      pipeline: [],
      concepts: {},
    },
  ],
  securityMatrix: [
    {
      routeId: "route-1",
      method: "GET",
      path: "/users",
      auth: { state: "missing" },
      role: { state: "unknown" },
      validation: { state: "confirmed" },
      rateLimit: { state: "unknown" },
      db: { state: "confirmed" },
      rls: { state: "unknown" },
      audit: { state: "unknown" },
      findingCount: 1,
    },
  ],
  findings: [
    {
      id: "finding-1",
      scopeId: "route-1",
      ruleId: "auth.missing",
      severity: "high",
      category: "security",
      message: "Auth fehlt auf Route",
      expectedState: "required",
      actualState: "missing",
      confidence: 90,
      evidenceFactIds: ["fact-1"],
    },
  ],
  facts: [
    {
      id: "fact-1",
      kind: "source",
      filePath: "src/routes/users.ts",
      line: 10,
      snippet: "export async function getUsers() {}",
      metadata: {},
    },
  ],
};

describe("DiagnosticsView", () => {
  it("renders Security sub-tab with matrix and findings by default", () => {
    render(<DiagnosticsView blueprint={blueprint} />);
    expect(screen.getByRole("tab", { name: "Security", selected: true })).toBeInTheDocument();
    expect(screen.getByText("Sicherheits-Matrix")).toBeInTheDocument();
    expect(screen.getByText("Auth fehlt auf Route")).toBeInTheDocument();
  });

  it("opens Problem-Inspektor when selecting a finding", () => {
    render(<DiagnosticsView blueprint={blueprint} />);
    fireEvent.click(screen.getByRole("button", { name: /Auth fehlt auf Route/i }));
    expect(screen.getByText("Erwartet")).toBeInTheDocument();
    expect(screen.getByText(/getUsers/)).toBeInTheDocument();
  });

  it("switches to placeholder tab", () => {
    render(<DiagnosticsView blueprint={blueprint} />);
    fireEvent.click(screen.getByRole("tab", { name: "Architecture" }));
    expect(screen.getByText("Architektur-Diagnose")).toBeInTheDocument();
  });
});
