/**
 * Expectation rule: abstract tenant-isolation missing.
 * Replaces legacy `db.rls-missing` — MariaDB/repo filters can satisfy the control.
 */

import type { AccessControlFinding } from "./types.js";

export const TENANT_ISOLATION_MISSING_RULE_ID = "access-control.tenant-isolation-missing";

/** @deprecated Use TENANT_ISOLATION_MISSING_RULE_ID */
export const LEGACY_RLS_MISSING_RULE_ID = "db.rls-missing";

export interface TenantIsolationPolicyFinding {
  id: string;
  ruleId: typeof TENANT_ISOLATION_MISSING_RULE_ID;
  category: "security";
  severity: "high" | "medium";
  scopeId: string;
  message: string;
  expectedState: string;
  actualState: string;
  evidenceFactIds: string[];
  confidence: number;
  remediation: string;
}

const STATUS_RANK: Record<string, number> = {
  missing: 0,
  partial: 1,
  unverified: 2,
  unsupported: 3,
  "not-applicable": 4,
  protected: 5,
};

function pickWorse(
  current: AccessControlFinding | undefined,
  next: AccessControlFinding,
): AccessControlFinding {
  if (!current) return next;
  return (STATUS_RANK[next.status] ?? 99) < (STATUS_RANK[current.status] ?? 99) ? next : current;
}

/**
 * Emit policy findings when tenant-isolation is missing on data-touching routes.
 * Protected / not-applicable / unsupported (unknown DB) do not emit.
 * Single-pass O(n) over findings.
 */
export function evaluateTenantIsolationPolicy(
  accessControlFindings: AccessControlFinding[],
): TenantIsolationPolicyFinding[] {
  const worstByRoute = new Map<string, AccessControlFinding>();

  for (const finding of accessControlFindings) {
    if (finding.resourceKind !== "route" || finding.control !== "tenant-isolation") continue;
    worstByRoute.set(finding.resourceId, pickWorse(worstByRoute.get(finding.resourceId), finding));
  }

  const policyFindings: TenantIsolationPolicyFinding[] = [];
  for (const [routeId, tenant] of worstByRoute) {
    if (
      tenant.status === "protected" ||
      tenant.status === "not-applicable" ||
      tenant.status === "unsupported"
    ) {
      continue;
    }
    if (tenant.status !== "missing" && tenant.status !== "partial") continue;

    const hasRepoFilter = tenant.mechanisms.some(
      (m) => m.kind === "repository-filter" || m.kind === "tenant-filter",
    );
    // Partial with repo filter still present is OK for MariaDB-style stacks.
    if (tenant.status === "partial" && hasRepoFilter && !tenant.warning?.includes("bypass")) {
      continue;
    }

    policyFindings.push({
      id: `finding-tenant-${routeId}`,
      ruleId: TENANT_ISOLATION_MISSING_RULE_ID,
      category: "security",
      severity: tenant.status === "missing" ? "high" : "medium",
      scopeId: routeId,
      message:
        tenant.status === "missing"
          ? "Tenant-Isolation fehlt für datenbezogene Route (kein RLS/Filter nachgewiesen)."
          : "Tenant-Isolation nur teilweise nachgewiesen — Bypass-Risiko prüfen.",
      expectedState: "tenant-isolation protected",
      actualState: tenant.status,
      evidenceFactIds: tenant.evidence.map((e) => e.factId ?? e.id),
      confidence: Math.round((tenant.confidence ?? 0.7) * 100),
      remediation:
        "Tenant-/Org-Filter in Repository/Query sicherstellen oder DB-native Row Policy (z. B. PostgreSQL RLS) ergänzen. RLS ist nicht universell erforderlich.",
    });
  }
  return policyFindings;
}

/** Map legacy rule ids in UI/fixtures to the abstract tenant-isolation rule. */
export function normalizeLegacySecurityRuleId(ruleId: string): string {
  if (ruleId === LEGACY_RLS_MISSING_RULE_ID) return TENANT_ISOLATION_MISSING_RULE_ID;
  return ruleId;
}
