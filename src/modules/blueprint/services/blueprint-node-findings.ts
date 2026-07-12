/**
 * Heuristic matching between a pipeline node and related Blueprint findings.
 * Location: src/modules/blueprint/services/blueprint-node-findings.ts
 */

import type { BlueprintFinding, PipelineNode } from "../types";

const RULE_KEYWORDS: Record<string, string[]> = {
  "auth-gate": ["auth"],
  "role-gate": ["role", "permission"],
  "validation-gate": ["validation", "valid"],
  "rate-limit": ["rate", "limit"],
  "db-write": ["db", "database", "write"],
  "db-read": ["db", "database", "read"],
  "audit-log": ["audit"],
  "external-api": ["external"],
};

export function relatedFindingsForNode(
  node: PipelineNode,
  findings: BlueprintFinding[],
): BlueprintFinding[] {
  const keywords = RULE_KEYWORDS[node.type] ?? [];
  if (keywords.length === 0) return [];

  return findings.filter((finding) => matchesNode(node, finding, keywords));
}

function matchesNode(node: PipelineNode, finding: BlueprintFinding, keywords: string[]): boolean {
  const text =
    `${finding.ruleId} ${finding.message} ${finding.expectedState} ${finding.actualState}`.toLowerCase();
  return keywords.some((keyword) => text.includes(keyword.toLowerCase()));
}
