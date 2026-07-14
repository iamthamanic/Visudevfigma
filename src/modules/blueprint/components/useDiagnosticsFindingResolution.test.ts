/**
 * Tests resolution scope reset when blueprint identity or findings change.
 */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { BlueprintData, BlueprintFinding } from "../types";
import { useDiagnosticsFindingResolution } from "./useDiagnosticsFindingResolution.js";

const finding: BlueprintFinding = {
  id: "finding-1",
  scopeId: "route-1",
  ruleId: "auth.missing",
  severity: "high",
  category: "security",
  message: "Auth fehlt",
  expectedState: "required",
  actualState: "missing",
  confidence: 90,
  evidenceFactIds: ["fact-1"],
};

function makeBlueprint(overrides: Partial<BlueprintData> = {}): BlueprintData {
  return {
    version: 1,
    projectId: "project-a",
    findings: [finding],
    ...overrides,
  };
}

describe("useDiagnosticsFindingResolution", () => {
  it("resets resolved state when blueprint scope changes", () => {
    const { result, rerender } = renderHook(
      ({ blueprint, selectedFinding }) =>
        useDiagnosticsFindingResolution(blueprint, selectedFinding),
      {
        initialProps: {
          blueprint: makeBlueprint(),
          selectedFinding: finding,
        },
      },
    );

    act(() => {
      result.current.toggleSelectedFindingResolved();
    });
    expect(result.current.selectedResolutionStatus).toBe("resolved");

    rerender({
      blueprint: makeBlueprint({ projectId: "project-b" }),
      selectedFinding: finding,
    });
    expect(result.current.selectedResolutionStatus).toBe("open");
  });
});
