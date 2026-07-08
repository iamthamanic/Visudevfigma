/** Strict CodeFact Zod validation for Blueprint export boundaries. */

import { z } from "zod";
import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import { sanitizeFactMetadataForExport } from "./fact-metadata-sanitizer.ts";
import { sanitizeSnippetForExport } from "./snippet-sanitizer.ts";
import { sanitizeExportIdentifier } from "./evidence-sanitizer.ts";

const codeFactExportSchema = z.object({
  id: z.string().trim().min(1).max(120),
  kind: z.string().trim().min(1).max(64),
  filePath: z.string().trim().min(1).max(260),
  line: z.number().int().positive(),
  snippet: z.string().max(121),
  metadata: z.record(z.unknown()).refine(
    (value) => !Array.isArray(value),
    "metadata must be a plain object",
  ),
});

export function normalizeCodeFactForExport(fact: unknown): CodeFact | null {
  const parsed = codeFactExportSchema.safeParse(fact);
  if (!parsed.success) return null;

  const safe = parsed.data;
  return {
    id: sanitizeExportIdentifier(safe.id, 120),
    kind: safe.kind,
    filePath: safe.filePath,
    line: safe.line,
    snippet: sanitizeSnippetForExport(safe.snippet),
    metadata: sanitizeFactMetadataForExport(safe.metadata),
  };
}

export function sanitizeFactsForExport(facts: CodeFact[]): CodeFact[] {
  if (!Array.isArray(facts)) return [];
  const normalized: CodeFact[] = [];
  for (const fact of facts) {
    const safe = normalizeCodeFactForExport(fact);
    if (safe) normalized.push(safe);
  }
  return normalized;
}
