/** VisuDevEvidence snippet sanitization for Blueprint export. */

import type { VisuDevEvidence } from "../../dto/graph/visudev-graph.dto.ts";
import {
  redactPiiInText,
  sanitizeSnippetForExport,
} from "./snippet-sanitizer.ts";

export function sanitizeExportIdentifier(value: string, maxLen = 120): string {
  let next = redactPiiInText(value);
  next = next.replace(
    /api-route-express-[A-Z]+-\/[^\s"']+/gi,
    (match) => `api-route-express-${match.length}`,
  );
  return next.trim().slice(0, maxLen);
}

export function sanitizeEvidenceForExport(
  evidence: VisuDevEvidence[],
): VisuDevEvidence[] {
  return evidence.map((item) => ({
    ...item,
    id: sanitizeExportIdentifier(item.id, 80),
    factId: sanitizeExportIdentifier(item.factId, 120),
    subjectId: sanitizeExportIdentifier(item.subjectId, 120),
    snippet: sanitizeSnippetForExport(item.snippet),
    summary: sanitizeExportIdentifier(item.summary, 120),
  }));
}
