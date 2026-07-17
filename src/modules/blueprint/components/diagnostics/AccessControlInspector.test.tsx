/**
 * Vitest for AccessControlInspector — mechanisms, unsupported badge, control filter.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { AccessControlFinding } from "../../../../lib/visudev/access-control-types";
import { AccessControlInspector } from "./AccessControlInspector";

const findings: AccessControlFinding[] = [
  {
    id: "acf-tenant",
    resourceId: "route-1",
    resourceKind: "route",
    control: "tenant-isolation",
    status: "missing",
    mechanisms: [
      {
        kind: "database-row-policy",
        label: "PostgreSQL RLS",
        technology: "postgres",
      },
    ],
    enforcementLayers: ["database", "repository"],
    evidence: [
      {
        id: "ev-1",
        kind: "sql",
        filePath: "db/policy.sql",
        line: 4,
        excerpt: "ENABLE ROW LEVEL SECURITY",
      },
    ],
    confidence: 90,
    warning: "Direct table access may bypass API filters",
  },
  {
    id: "acf-unsupported",
    resourceId: "route-1",
    resourceKind: "route",
    control: "tenant-isolation",
    status: "unsupported",
    mechanisms: [],
    enforcementLayers: ["database"],
    evidence: [],
    confidence: 40,
  },
];

describe("AccessControlInspector", () => {
  it("shows empty state without selection", () => {
    render(<AccessControlInspector findings={findings} routeId={null} selectedControl={null} />);
    expect(screen.getByTestId("access-control-inspector")).toBeInTheDocument();
    expect(screen.getByText(/Klicke eine Matrix-Zelle/)).toBeInTheDocument();
  });

  it("shows route prompt without opening a random control detail", () => {
    render(
      <AccessControlInspector
        findings={findings}
        routeId="route-1"
        selectedControl={null}
        routeLabel="GET /users"
      />,
    );
    expect(screen.getByTestId("ac-route-prompt")).toHaveTextContent("Tenant-Isolation");
    expect(screen.queryByTestId("ac-mechanisms")).not.toBeInTheDocument();
  });

  it("filters findings by control and shows mechanisms, layers, evidence, warning", () => {
    render(
      <AccessControlInspector
        findings={[findings[0]]}
        routeId="route-1"
        selectedControl="tenant-isolation"
        routeLabel="GET /users"
      />,
    );
    expect(screen.getByText("Tenant-Isolation")).toBeInTheDocument();
    expect(screen.getByTestId("ac-mechanisms")).toHaveTextContent("PostgreSQL RLS");
    expect(screen.getByTestId("ac-enforcement-layers")).toHaveTextContent("database");
    expect(screen.getByTestId("ac-evidence")).toHaveTextContent("db/policy.sql:4");
    expect(screen.getByTestId("ac-bypass-warning")).toHaveTextContent("Bypass-Hinweis");
  });

  it("renders unsupported as ⊘ unknown badge, not critical", () => {
    render(
      <AccessControlInspector
        findings={[findings[1]]}
        routeId="route-1"
        selectedControl="tenant-isolation"
      />,
    );
    const badges = screen.getAllByText(/Nicht unterstützt/);
    expect(badges.length).toBeGreaterThan(0);
    expect(badges[0].textContent).toContain("⊘");
    expect(badges[0].closest("[data-variant]")).toHaveAttribute("data-variant", "unknown");
    expect(screen.queryByText(/Kritisch/i)).not.toBeInTheDocument();
  });
});
