import { describe, expect, it } from "vitest";
import type { AccessControlFinding } from "./types.js";
import {
  TENANT_ISOLATION_MISSING_RULE_ID,
  evaluateTenantIsolationPolicy,
  normalizeLegacySecurityRuleId,
} from "./tenant-isolation-policy.js";

function finding(
  partial: Partial<AccessControlFinding> & Pick<AccessControlFinding, "id" | "status">,
): AccessControlFinding {
  return {
    resourceId: "r1",
    resourceKind: "route",
    control: "tenant-isolation",
    mechanisms: [],
    enforcementLayers: ["repository"],
    evidence: [],
    confidence: 0.8,
    ...partial,
  };
}

describe("evaluateTenantIsolationPolicy", () => {
  it("emits access-control.tenant-isolation-missing when tenant control is missing", () => {
    const findings = evaluateTenantIsolationPolicy([finding({ id: "t1", status: "missing" })]);
    expect(findings).toHaveLength(1);
    expect(findings[0]?.ruleId).toBe(TENANT_ISOLATION_MISSING_RULE_ID);
  });

  it("MariaDB + repository tenant filter → protected: no missing rule", () => {
    const findings = evaluateTenantIsolationPolicy([
      finding({
        id: "t2",
        status: "protected",
        mechanisms: [
          {
            kind: "repository-filter",
            label: "Repository Query Filter",
            technology: "mariadb",
          },
          { kind: "tenant-filter", label: "Tenant Filter", technology: "app" },
        ],
      }),
    ]);
    expect(findings).toHaveLength(0);
  });

  it("does not emit for unsupported (unknown DB dialect honesty)", () => {
    expect(
      evaluateTenantIsolationPolicy([finding({ id: "t3", status: "unsupported" })]),
    ).toHaveLength(0);
  });

  it("normalizes legacy db.rls-missing to abstract rule id", () => {
    expect(normalizeLegacySecurityRuleId("db.rls-missing")).toBe(TENANT_ISOLATION_MISSING_RULE_ID);
  });
});
