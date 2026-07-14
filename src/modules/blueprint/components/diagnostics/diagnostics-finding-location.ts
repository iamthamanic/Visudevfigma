/**
 * Resolve German location labels for diagnostics findings (route, file, matrix).
 */

import type { BlueprintFinding, CodeFact, RouteBlueprint, SecurityMatrixRow } from "../../types";

export function primaryEvidenceFact(finding: BlueprintFinding, facts: CodeFact[]): CodeFact | null {
  const factMap = new Map(facts.map((fact) => [fact.id, fact]));
  for (const id of finding.evidenceFactIds) {
    const fact = factMap.get(id);
    if (fact) return fact;
  }
  return null;
}

export function findingLocationLabel(
  finding: BlueprintFinding,
  facts: CodeFact[],
  route: RouteBlueprint | null,
): string {
  const evidence = primaryEvidenceFact(finding, facts);
  if (evidence) return `${evidence.filePath}:${evidence.line}`;
  if (route) return `${route.method} ${route.path}`;
  return finding.scopeId;
}

export function matrixLocationLabel(row: SecurityMatrixRow | null): string | null {
  if (!row) return null;
  return `Matrix · ${row.method} ${row.path}`;
}

export function isSqlEvidence(fact: CodeFact): boolean {
  if (fact.kind.toLowerCase().includes("sql")) return true;
  return /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN)\b/i.test(fact.snippet);
}
