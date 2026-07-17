/**
 * Derive route-level access control matrix from stack-agnostic findings.
 * Indexes findings once (O(F)) then builds rows in O(R·C) — avoids repeated scans.
 */

import type {
  AccessControlControl,
  AccessControlFinding,
  AccessControlMatrixCell,
  AccessControlMatrixRow,
  AccessControlStatus,
} from "./access-control.types.js";
import { worstAccessControlStatus } from "./access-control-status.js";

export interface RouteRef {
  id: string;
  method: string;
  path: string;
}

type MatrixColumn = keyof Omit<
  AccessControlMatrixRow,
  "routeId" | "method" | "path" | "overallStatus" | "findingCount"
>;

const CONTROL_TO_COLUMN: Record<AccessControlControl, MatrixColumn | null> = {
  authentication: "authentication",
  authorization: "authorization",
  "resource-scope": "resourceScope",
  "tenant-isolation": "tenantIsolation",
  ownership: "ownership",
  validation: "validation",
  "rate-limit": "rateLimit",
  "read-restriction": "resourceScope",
  "write-restriction": "resourceScope",
  "privileged-access": "authorization",
  audit: "audit",
  encryption: null,
};

const MATRIX_COLUMNS: MatrixColumn[] = [
  "authentication",
  "authorization",
  "resourceScope",
  "tenantIsolation",
  "ownership",
  "validation",
  "rateLimit",
  "audit",
];

function emptyCell(): AccessControlMatrixCell {
  return { status: "unverified" };
}

function cellFromFindings(findings: AccessControlFinding[]): AccessControlMatrixCell {
  if (findings.length === 0) return emptyCell();
  const status = worstAccessControlStatus(findings.map((f) => f.status));
  const primary = findings.find((f) => f.mechanisms[0])?.mechanisms[0];
  return {
    status,
    mechanismLabel: primary?.label,
  };
}

function isRouteScopedFinding(finding: AccessControlFinding): boolean {
  return finding.resourceKind === "route";
}

/** Index route findings by resourceId → column → findings (single pass). */
function indexRouteFindingsByColumn(
  findings: AccessControlFinding[],
): Map<string, Map<MatrixColumn, AccessControlFinding[]>> {
  const byRoute = new Map<string, Map<MatrixColumn, AccessControlFinding[]>>();

  for (const finding of findings) {
    if (!isRouteScopedFinding(finding)) continue;
    const column = CONTROL_TO_COLUMN[finding.control];
    if (!column) continue;

    let byColumn = byRoute.get(finding.resourceId);
    if (!byColumn) {
      byColumn = new Map();
      byRoute.set(finding.resourceId, byColumn);
    }
    const bucket = byColumn.get(column) ?? [];
    bucket.push(finding);
    byColumn.set(column, bucket);
  }

  return byRoute;
}

function countRouteFindings(findings: AccessControlFinding[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const finding of findings) {
    if (!isRouteScopedFinding(finding)) continue;
    counts.set(finding.resourceId, (counts.get(finding.resourceId) ?? 0) + 1);
  }
  return counts;
}

/** Build matrix rows for routes from access control findings. */
export function deriveAccessControlMatrixFromFindings(
  routes: RouteRef[],
  findings: AccessControlFinding[],
): AccessControlMatrixRow[] {
  const indexed = indexRouteFindingsByColumn(findings);
  const routeFindingCounts = countRouteFindings(findings);

  return routes.map((route) => {
    const byColumn = indexed.get(route.id);
    const pick = (column: MatrixColumn) => cellFromFindings(byColumn?.get(column) ?? []);

    const row: AccessControlMatrixRow = {
      routeId: route.id,
      method: route.method,
      path: route.path,
      authentication: pick("authentication"),
      authorization: pick("authorization"),
      resourceScope: pick("resourceScope"),
      tenantIsolation: pick("tenantIsolation"),
      ownership: pick("ownership"),
      validation: pick("validation"),
      rateLimit: pick("rateLimit"),
      audit: pick("audit"),
      overallStatus: "unverified",
      findingCount: routeFindingCounts.get(route.id) ?? 0,
    };

    const statuses = MATRIX_COLUMNS.map((col) => row[col].status).filter(
      (s): s is AccessControlStatus => s != null,
    );

    row.overallStatus = worstAccessControlStatus(statuses);
    return row;
  });
}
