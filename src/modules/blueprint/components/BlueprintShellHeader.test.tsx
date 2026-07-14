/**
 * Tests for BlueprintShellHeader (issue 105).
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { BlueprintShellHeader } from "./BlueprintShellHeader";

describe("BlueprintShellHeader", () => {
  it("renders project, branch, and blueprint badge", () => {
    render(
      <BlueprintShellHeader
        projectName="VisuDEV Demo"
        branchLabel="develop"
        scanStatus="completed"
        onRescan={vi.fn()}
        onExportJson={vi.fn()}
      />,
    );

    expect(screen.getByText("VisuDEV Demo")).toBeInTheDocument();
    expect(screen.getByText("develop")).toBeInTheDocument();
    expect(screen.getByText("Blueprint")).toBeInTheDocument();
    expect(screen.getByText("Scan abgeschlossen")).toBeInTheDocument();
  });

  it("exposes full labels via title for long project names", () => {
    const longName = "organisation-very-long-repository-name-that-overflows";
    render(
      <BlueprintShellHeader
        projectName={longName}
        branchLabel="feature/some-very-long-branch-name"
        scanStatus="idle"
        onRescan={vi.fn()}
        onExportJson={vi.fn()}
      />,
    );

    expect(screen.getByTitle(longName)).toBeInTheDocument();
    expect(screen.getByTitle("feature/some-very-long-branch-name")).toBeInTheDocument();
    expect(screen.getByText(/organisation-very-long-repository-name-that-ove/)).toBeInTheDocument();
  });

  it("clamps invalid notification counts", () => {
    render(
      <BlueprintShellHeader
        projectName="Demo"
        scanStatus="idle"
        notificationCount={-3}
        onRescan={vi.fn()}
        onExportJson={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "Benachrichtigungen" })).toBeInTheDocument();
    expect(screen.queryByText("-3")).not.toBeInTheDocument();
  });

  it("shows running scan status while rescanning", () => {
    render(
      <BlueprintShellHeader
        projectName="Demo"
        branchLabel="main"
        scanStatus="completed"
        isRescanning
        onRescan={vi.fn()}
        onExportJson={vi.fn()}
      />,
    );

    expect(screen.getByText("Analysiere…")).toBeInTheDocument();
  });

  it("calls action handlers", () => {
    const onRescan = vi.fn();
    const onExportJson = vi.fn();

    render(
      <BlueprintShellHeader
        projectName="Demo"
        scanStatus="idle"
        onRescan={onRescan}
        onExportJson={onExportJson}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: /Blueprint neu analysieren/i }));
    fireEvent.click(screen.getByRole("button", { name: /JSON exportieren/i }));

    expect(onRescan).toHaveBeenCalledOnce();
    expect(onExportJson).toHaveBeenCalledOnce();
  });
});
