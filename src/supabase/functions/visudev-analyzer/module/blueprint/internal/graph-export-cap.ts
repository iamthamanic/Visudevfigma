/** Orchestrates VisuDevGraph export: coerce → sanitize → trim → validate. */

import type { VisuDevGraph } from "../../dto/graph/visudev-graph.dto.ts";
import {
  coerceVisuDevGraphInput,
  validateVisuDevGraphForExport,
} from "../../validators/visudev-graph.validator.ts";
import { repairGraphReferences } from "./graph-export-integrity.ts";
import { sanitizeGraphForExport } from "./graph-export-sanitize.ts";
import { trimGraphEvidence } from "./graph-export-trim.ts";

export const MAX_BLUEPRINT_FACTS = 500;

export function capGraphForExport(input: unknown): VisuDevGraph {
  const coerced = coerceVisuDevGraphInput(input);
  const sanitized = sanitizeGraphForExport(coerced);
  const capped = sanitized.evidence.length > MAX_BLUEPRINT_FACTS
    ? trimGraphEvidence(sanitized, MAX_BLUEPRINT_FACTS)
    : sanitized;
  const repaired = repairGraphReferences(capped);
  return validateVisuDevGraphForExport(repaired);
}
