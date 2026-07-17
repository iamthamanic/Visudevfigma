/**
 * Synthesize deprecated SecurityMatrixRow[] from AccessControlMatrixRow[].
 * Why: one release of KV/UI compat while Diagnostics migrates to accessControlMatrix.
 */

import type { AccessControlMatrixRow, AccessControlStatus } from "./access-control.types.js";
import type { ConceptState, ProjectedSecurityMatrixRow } from "./blueprint-graph-types.js";

function toConceptState(status: AccessControlStatus): ConceptState | "n/a" {
  switch (status) {
    case "protected":
      return "confirmed";
    case "partial":
      return "partial";
    case "missing":
      return "missing";
    case "not-applicable":
      return "n/a";
    case "unsupported":
    case "unverified":
    default:
      return "unknown";
  }
}

/** Map stack-agnostic AC matrix rows into legacy SecurityMatrix (RLS always n/a). */
export function synthesizeSecurityMatrixFromAccessControl(
  rows: AccessControlMatrixRow[],
): ProjectedSecurityMatrixRow[] {
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => ({
    routeId: row.routeId,
    method: row.method,
    path: row.path,
    auth: { state: toConceptState(row.authentication?.status ?? "unverified") },
    role: { state: toConceptState(row.authorization?.status ?? "unverified") },
    validation: { state: toConceptState(row.validation?.status ?? "unverified") },
    rateLimit: { state: toConceptState(row.rateLimit?.status ?? "unverified") },
    db: { state: toConceptState(row.resourceScope?.status ?? "unverified") },
    rls: { state: "n/a" },
    audit: { state: toConceptState(row.audit?.status ?? "unverified") },
    findingCount:
      typeof row.findingCount === "number" && Number.isFinite(row.findingCount)
        ? row.findingCount
        : 0,
  }));
}
