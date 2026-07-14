/**
 * Session-local "resolved" markers for Diagnostics findings.
 * Not persisted — resets when the analyzed blueprint identity changes so stale
 * statuses cannot leak across projects or re-analysis runs.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import type { BlueprintData, BlueprintFinding } from "../types";
import type { FindingResolutionStatus } from "./diagnostics/finding-resolution.js";

function blueprintResolutionScope(blueprint: BlueprintData): string {
  const findingIds = (blueprint.findings ?? [])
    .map((finding) => finding.id)
    .sort()
    .join(",");
  return [
    blueprint.projectId ?? "",
    blueprint.commitSha ?? "",
    blueprint.updatedAt ?? "",
    findingIds,
  ].join("|");
}

export function useDiagnosticsFindingResolution(
  blueprint: BlueprintData,
  selectedFinding: BlueprintFinding | null,
) {
  const scopeKey = useMemo(() => blueprintResolutionScope(blueprint), [blueprint]);
  const validFindingIds = useMemo(
    () => new Set((blueprint.findings ?? []).map((finding) => finding.id)),
    [blueprint.findings],
  );

  const [resolutionByFindingId, setResolutionByFindingId] = useState<
    Record<string, FindingResolutionStatus>
  >({});

  useEffect(() => {
    setResolutionByFindingId({});
  }, [scopeKey]);

  useEffect(() => {
    setResolutionByFindingId((current) => {
      const pruned = Object.fromEntries(
        Object.entries(current).filter(([findingId]) => validFindingIds.has(findingId)),
      ) as Record<string, FindingResolutionStatus>;
      return Object.keys(pruned).length === Object.keys(current).length ? current : pruned;
    });
  }, [validFindingIds]);

  const selectedResolutionStatus: FindingResolutionStatus =
    selectedFinding && resolutionByFindingId[selectedFinding.id] === "resolved"
      ? "resolved"
      : "open";

  const toggleSelectedFindingResolved = useCallback(() => {
    if (!selectedFinding || !validFindingIds.has(selectedFinding.id)) return;
    setResolutionByFindingId((current) => {
      const next = { ...current };
      if (next[selectedFinding.id] === "resolved") {
        delete next[selectedFinding.id];
      } else {
        next[selectedFinding.id] = "resolved";
      }
      return next;
    });
  }, [selectedFinding, validFindingIds]);

  return useMemo(
    () => ({
      resolutionByFindingId,
      selectedResolutionStatus,
      toggleSelectedFindingResolved,
    }),
    [resolutionByFindingId, selectedResolutionStatus, toggleSelectedFindingResolved],
  );
}
