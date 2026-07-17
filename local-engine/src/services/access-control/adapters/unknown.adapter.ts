/**
 * Unknown / unsupported database security adapter.
 * Uses application-layer evidence only — never emits false RLS criticals.
 */

import type {
  AccessControlFinding,
  DatabaseSecurityAdapter,
  DatabaseSecurityAdapterInput,
} from "../types.js";

function unknownFinding(
  resourceId: string,
  control: AccessControlFinding["control"],
): AccessControlFinding {
  return {
    id: `ac-db-unknown-${control}-${resourceId}`,
    resourceId,
    resourceKind: "route",
    control,
    status: "unsupported",
    mechanisms: [],
    enforcementLayers: ["database"],
    evidence: [],
    confidence: 0.4,
    warning: "Database dialect unknown or unsupported — DB-native mechanisms not assessed.",
    ruleId: "access-control.db-unknown",
  };
}

export const unknownDatabaseSecurityAdapter: DatabaseSecurityAdapter = {
  dialect: "unknown",
  analyze(input: DatabaseSecurityAdapterInput): AccessControlFinding[] {
    const resourceIds = input.resourceIds?.length ? input.resourceIds : ["*"];
    const findings: AccessControlFinding[] = [];
    for (const resourceId of resourceIds) {
      // Honest unsupported for DB-native controls; never invent RLS criticals.
      findings.push(unknownFinding(resourceId, "tenant-isolation"));
      findings.push(unknownFinding(resourceId, "resource-scope"));
    }
    return findings;
  },
};
