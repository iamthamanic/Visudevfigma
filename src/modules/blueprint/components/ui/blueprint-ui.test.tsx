/**
 * Vitest smoke tests for shared Blueprint UI primitives (#85).
 */

import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import {
  BlueprintViewLayout,
  InspectorPanel,
  MetricCard,
  RelationshipChip,
  RELATIONSHIP_LABELS,
  StatusBadge,
  StepCard,
  ViewSectionTitle,
} from "./index";

describe("Blueprint UI primitives", () => {
  it("renders ViewSectionTitle uppercase", () => {
    render(<ViewSectionTitle>Beziehungstypen</ViewSectionTitle>);
    expect(screen.getByText("Beziehungstypen")).toBeInTheDocument();
  });

  it("renders StatusBadge with variant", () => {
    render(<StatusBadge variant="running" label="RUNNING" />);
    expect(screen.getByText("RUNNING")).toBeInTheDocument();
  });

  it("toggles RelationshipChip", () => {
    const onToggle = vi.fn();
    render(<RelationshipChip kind="imports" active={false} onToggle={onToggle} />);
    fireEvent.click(screen.getByRole("button", { name: /Imports/i }));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("exposes relationship labels for all kinds", () => {
    expect(Object.keys(RELATIONSHIP_LABELS)).toHaveLength(8);
  });

  it("renders InspectorPanel with sections and code excerpt", () => {
    render(
      <InspectorPanel
        title="CreateLeaveRequest"
        subtitle="POST /api/leave"
        sections={[
          {
            id: "evidence",
            title: "Evidence",
            content: <pre>SELECT 1</pre>,
          },
        ]}
      />,
    );
    expect(screen.getByText("Inspektor")).toBeInTheDocument();
    expect(screen.getByText("CreateLeaveRequest")).toBeInTheDocument();
    expect(screen.getByText("Evidence")).toBeInTheDocument();
  });

  it("renders MetricCard with value and delta", () => {
    render(<MetricCard label="Neue Module" value="+4" delta="vs. f1a7d9c" accent="green" />);
    expect(screen.getByText("+4")).toBeInTheDocument();
    expect(screen.getByText("vs. f1a7d9c")).toBeInTheDocument();
  });

  it("renders StepCard and handles selection", () => {
    const onSelect = vi.fn();
    render(
      <StepCard
        stepNumber={1}
        title="LeaveRequestForm.onSubmit"
        subtitle="Web (React)"
        durationMs={32}
        onSelect={onSelect}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: /LeaveRequestForm/i }));
    expect(onSelect).toHaveBeenCalledOnce();
  });

  it("renders BlueprintViewLayout slots", () => {
    render(
      <BlueprintViewLayout
        controls={<div>Controls</div>}
        canvas={<div>Canvas</div>}
        inspector={<div>Inspector slot</div>}
      />,
    );
    expect(screen.getByText("Controls")).toBeInTheDocument();
    expect(screen.getByText("Canvas")).toBeInTheDocument();
    expect(screen.getByText("Inspector slot")).toBeInTheDocument();
  });
});
