/**
 * Resets and applies the default diagnostics finding on blueprint reload.
 */

import { useEffect, useRef } from "react";
import type { BlueprintFinding } from "../types";

export function useDiagnosticsDefaultFindingSelection(
  allFindings: BlueprintFinding[],
  selectedFindingId: string | null,
  setSelectedFindingId: (findingId: string | null) => void,
  diagnosticsSnapshotKey: string,
): void {
  const pendingAutoSelectFinding = useRef(true);

  useEffect(() => {
    pendingAutoSelectFinding.current = true;
    setSelectedFindingId(null);
  }, [diagnosticsSnapshotKey, setSelectedFindingId]);

  useEffect(() => {
    if (!pendingAutoSelectFinding.current || allFindings.length === 0) return;
    if (selectedFindingId) {
      pendingAutoSelectFinding.current = false;
      return;
    }
    const defaultCriticalFinding =
      allFindings.find((finding) => finding.severity === "critical") ?? allFindings[0] ?? null;
    if (defaultCriticalFinding) {
      setSelectedFindingId(defaultCriticalFinding.id);
      pendingAutoSelectFinding.current = false;
    }
  }, [allFindings, selectedFindingId, diagnosticsSnapshotKey, setSelectedFindingId]);
}
