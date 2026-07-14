/**
 * Derives route-level access control matrix rows from mechanism findings.
 */

import type {
  AccessControlFinding,
  AccessControlMatrixRow,
  AccessControlMechanism,
  AccessControlStatus,
} from "./access-control.types.js";

const MECHANISMS: AccessControlMechanism[] = ["authn", "authz", "scope", "tenant", "ownership"];

const STATUS_RANK: Record<AccessControlStatus, number> = {
  fail: 3,
  warn: 2,
  unknown: 1,
  pass: 0,
};

function worstStatus(statuses: AccessControlStatus[]): AccessControlStatus {
  return statuses.reduce<AccessControlStatus>((worst, status) => {
    return STATUS_RANK[status] > STATUS_RANK[worst] ? status : worst;
  }, "pass");
}

function parseRouteId(routeId: string): { method: string; path: string } {
  const spaceIndex = routeId.indexOf(" ");
  if (spaceIndex <= 0) {
    return { method: "GET", path: routeId };
  }
  return {
    method: routeId.slice(0, spaceIndex).trim() || "GET",
    path: routeId.slice(spaceIndex + 1).trim() || routeId,
  };
}

export function deriveAccessControlMatrixFromFindings(
  findings: AccessControlFinding[],
): AccessControlMatrixRow[] {
  const byRoute = new Map<string, Partial<Record<AccessControlMechanism, AccessControlStatus>>>();

  for (const finding of findings) {
    const routeStatuses = byRoute.get(finding.routeId) ?? {};
    const current = routeStatuses[finding.mechanism];
    if (!current || STATUS_RANK[finding.status] > STATUS_RANK[current]) {
      routeStatuses[finding.mechanism] = finding.status;
    }
    byRoute.set(finding.routeId, routeStatuses);
  }

  return [...byRoute.entries()].map(([routeId, mechanismStatuses]) => {
    const { method, path } = parseRouteId(routeId);
    const statuses = MECHANISMS.map(
      (mechanism) => mechanismStatuses[mechanism] ?? ("unknown" as AccessControlStatus),
    );

    return {
      routeId,
      method,
      path,
      authn: mechanismStatuses.authn ?? "unknown",
      authz: mechanismStatuses.authz ?? "unknown",
      scope: mechanismStatuses.scope ?? "unknown",
      tenant: mechanismStatuses.tenant ?? "unknown",
      ownership: mechanismStatuses.ownership ?? "unknown",
      status: worstStatus(statuses),
    };
  });
}
