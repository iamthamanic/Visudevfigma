/** Orchestrates VisuDevGraph export: coerce → sanitize → trim → validate. */

import type { VisuDevGraph } from "../../dto/graph/visudev-graph.dto.ts";
import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import {
  coerceVisuDevGraphInput,
  validateVisuDevGraphForExport,
} from "../../validators/visudev-graph.validator.ts";
import { repairGraphReferences } from "./graph-export-integrity.ts";
import { sanitizeGraphForExport } from "./graph-export-sanitize.ts";
import { trimGraphEvidence } from "./graph-export-trim.ts";

export const MAX_BLUEPRINT_FACTS = 500;

/** visudev-gapclose P1-3: never first-N truncate prisma schema models. */
export function isPrismaSchemaModelFact(fact: CodeFact): boolean {
  return (
    fact.kind === "db-write" &&
    fact.metadata?.framework === "prisma" &&
    fact.metadata?.operation === "prisma-model"
  );
}

/** visudev-gapclose P3-2b: keep compose/datasource infra facts past soft fact cap. */
export function isInfraServiceExportFact(fact: CodeFact): boolean {
  return (
    fact.kind === "infra-service" &&
    typeof fact.metadata?.service === "string" &&
    fact.metadata.service.trim().length > 0
  );
}

/**
 * Cap facts for export while keeping **all** prisma-model facts from parsed schemas
 * and infra-service engine facts (Postgres/Redis). Soft-cap may drop other facts.
 */
export function selectFactsPreservingPrismaModels(
  facts: CodeFact[],
  limit: number = MAX_BLUEPRINT_FACTS,
): CodeFact[] {
  const models: CodeFact[] = [];
  const infra: CodeFact[] = [];
  const rest: CodeFact[] = [];
  for (const fact of facts) {
    if (isPrismaSchemaModelFact(fact)) models.push(fact);
    else if (isInfraServiceExportFact(fact)) infra.push(fact);
    else rest.push(fact);
  }
  // Honesty: keep every model + infra engine even if over limit.
  const preserved = [...models, ...infra];
  const remaining = Math.max(0, limit - preserved.length);
  return [...preserved, ...rest.slice(0, remaining)];
}

export function capGraphForExport(input: unknown): VisuDevGraph {
  const coerced = coerceVisuDevGraphInput(input);
  const sanitized = sanitizeGraphForExport(coerced);
  const capped = sanitized.evidence.length > MAX_BLUEPRINT_FACTS
    ? trimGraphEvidence(sanitized, MAX_BLUEPRINT_FACTS)
    : sanitized;
  const repaired = repairGraphReferences(capped);
  return validateVisuDevGraphForExport(repaired);
}
