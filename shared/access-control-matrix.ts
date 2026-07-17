/**
 * Derive route-level access control matrix from stack-agnostic findings.
 * Location: shared/access-control-matrix.ts
 */

import type {
  AccessControlControl,
  AccessControlFinding,
  AccessControlMatrixCell,
  AccessControlMatrixRow,
  AccessControlStatus,
} from "./access-control.types.js";
import { worstAccessControlStatus } from "./access-control.types.js";

export interface RouteRef {
  id: string;
  method: string;
  path: string;
}

const CONTROL_TO_COLUMN: Record<
  AccessControlControl,
  | keyof Omit<
      AccessControlMatrixRow,
      "routeId" | "method" | "path" | "overallStatus" | "findingCount"
    >
  | null
> = {
  authentication: "authentication",
  authorization: "authorization",
  "resource-scope": "resourceScope",
  "tenant-isolation": "tenantIsolation",
  ownership: "ownership",
  validation: "validation",
  "read-restriction": "resourceScope",
  "write-restriction": "resourceScope",
  "privileged-access": "authorization",
  audit: "audit",
  encryption: null,
};

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

function findingsForRouteControl(
  findings: AccessControlFinding[],
  routeId: string,
  control: AccessControlControl,
): AccessControlFinding[] {
  return findings.filter(
    (f) =>
      f.resourceId === routeId &&
      (f.control === control ||
        (control === "resource-scope" &&
          (f.control === "read-restriction" || f.control === "write-restriction"))),
  );
}

/** Build matrix rows for routes from access control findings. */
export function deriveAccessControlMatrixFromFindings(
  routes: RouteRef[],
  findings: AccessControlFinding[],
): AccessControlMatrixRow[] {
  return routes.map((route) => {
    const routeFindings = findings.filter((f) => f.resourceId === route.id);
    const pick = (control: AccessControlControl) =>
      cellFromFindings(findingsForRouteControl(findings, route.id, control));

    const row: AccessControlMatrixRow = {
      routeId: route.id,
      method: route.method,
      path: route.path,
      authentication: pick("authentication"),
      authorization: pick("authorization"),
      resourceScope: pick("resource-scope"),
      tenantIsolation: pick("tenant-isolation"),
      ownership: pick("ownership"),
      validation: pick("validation"),
      rateLimit: emptyCell(),
      audit: pick("audit"),
      overallStatus: "unverified",
      findingCount: routeFindings.length,
    };

    const statuses = (
      Object.entries(CONTROL_TO_COLUMN) as Array<
        [AccessControlControl, keyof AccessControlMatrixRow | null]
      >
    )
      .map(([, col]) =>
        col && col in row ? (row[col as keyof typeof row] as AccessControlMatrixCell).status : null,
      )
      .filter((s): s is AccessControlStatus => s != null);

    row.overallStatus = worstAccessControlStatus(statuses);
    return row;
  });
}
