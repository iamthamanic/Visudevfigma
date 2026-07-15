/**
 * Derive a Status badge for a Security Matrix row from control cell states.
 */

import type { SecurityMatrixRow } from "../../types";
import type { StatusBadgeVariant } from "../ui/StatusBadge.js";

export type MatrixRowStatus = {
  label: "OK" | "Warnung" | "Hoch" | "Kritisch";
  variant: StatusBadgeVariant;
};

type MatrixCellState = SecurityMatrixRow["auth"]["state"];

function collectStates(row: SecurityMatrixRow): MatrixCellState[] {
  return [
    row.auth.state,
    row.role.state,
    row.validation.state,
    row.rateLimit.state,
    row.db.state,
    row.rls.state,
    row.audit.state,
  ];
}

export function matrixRowStatus(row: SecurityMatrixRow): MatrixRowStatus {
  const states = collectStates(row).filter((state) => state !== "n/a");
  if (states.some((state) => state === "missing" || state === "contradictory")) {
    return row.findingCount >= 3
      ? { label: "Kritisch", variant: "critical" }
      : { label: "Hoch", variant: "warning" };
  }
  if (states.some((state) => state === "partial" || state === "weak")) {
    return { label: "Warnung", variant: "warning" };
  }
  return { label: "OK", variant: "confirmed" };
}
