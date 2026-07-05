/** Blueprint finding helpers — src/modules/blueprint/services/blueprint-helpers.ts */

import type { BlueprintFinding } from "../types";

export function findingsForRoute(
  findings: BlueprintFinding[],
  routeId: string,
): BlueprintFinding[] {
  return findings.filter((f) => f.scopeId === routeId);
}
