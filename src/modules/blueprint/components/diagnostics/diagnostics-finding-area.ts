/**
 * Human-readable area label for Diagnostics finding filters.
 */

import type { BlueprintFinding } from "../../types";

export function findingAreaLabel(finding: BlueprintFinding): string {
  const category = (finding.category || "").trim();
  if (category) {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }
  const ruleId = (finding.ruleId || "").trim();
  if (!ruleId) return "Allgemein";
  const prefix = ruleId.split(/[./:-]/)[0] || ruleId;
  return prefix.charAt(0).toUpperCase() + prefix.slice(1);
}
