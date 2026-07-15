/**
 * Maps execution detail tabs to graph evidence excerpts (no synthetic fallbacks).
 */

import type { SoftwareGraphEvidence } from "../../types";

export type ExecutionDetailTabId =
  | "overview"
  | "payload"
  | "headers"
  | "logs"
  | "stacktrace"
  | "tags"
  | "code";

export function filterExecutionEvidenceByTab(
  tab: ExecutionDetailTabId,
  evidence: SoftwareGraphEvidence[],
): SoftwareGraphEvidence[] {
  if (tab === "code") return evidence;
  if (tab === "payload") return evidence.filter((entry) => /payload/i.test(entry.kind));
  if (tab === "headers") return evidence.filter((entry) => /auth|header/i.test(entry.kind));
  if (tab === "logs") return evidence.filter((entry) => /log/i.test(entry.kind));
  if (tab === "stacktrace") {
    return evidence.filter(
      (entry) =>
        /stack/i.test(entry.kind) || (/trace/i.test(entry.kind) && !/trace-tag/i.test(entry.kind)),
    );
  }
  if (tab === "tags") return evidence.filter((entry) => /tag/i.test(entry.kind));
  return [];
}

export function resolveExecutionTabContent(
  tab: ExecutionDetailTabId,
  evidence: SoftwareGraphEvidence[],
): { tabEvidence: SoftwareGraphEvidence[]; resolvedTabText: string | null } {
  const tabEvidence = filterExecutionEvidenceByTab(tab, evidence);
  const resolvedTabText =
    tabEvidence.length > 0 ? tabEvidence.map((entry) => entry.excerpt).join("\n\n") : null;
  return { tabEvidence, resolvedTabText };
}
