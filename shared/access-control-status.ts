/**
 * Status ranking and display helpers for access control outcomes.
 * Isolated from domain types so UI/badge changes do not churn the schema module.
 */

import type { AccessControlStatus } from "./access-control.types.js";

/** Lower rank = worse outcome (used when folding multiple findings). */
export const ACCESS_CONTROL_STATUS_RANK: Record<AccessControlStatus, number> = {
  missing: 0,
  partial: 1,
  unverified: 2,
  unsupported: 3,
  "not-applicable": 4,
  protected: 5,
};

export function worstAccessControlStatus(statuses: AccessControlStatus[]): AccessControlStatus {
  if (statuses.length === 0) return "unverified";
  return statuses.reduce((worst, current) =>
    ACCESS_CONTROL_STATUS_RANK[current] < ACCESS_CONTROL_STATUS_RANK[worst] ? current : worst,
  );
}

export function accessControlStatusSymbol(status: AccessControlStatus): string {
  switch (status) {
    case "protected":
      return "✓";
    case "partial":
      return "~";
    case "missing":
      return "✕";
    case "not-applicable":
      return "—";
    case "unsupported":
      return "⊘";
    default:
      return "?";
  }
}
