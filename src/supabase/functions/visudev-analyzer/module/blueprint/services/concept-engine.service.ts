/** Aggregates CodeFacts into TechnicalConcepts per route scope. */

import type {
  CodeFact,
  ConceptState,
  ConceptType,
  TechnicalConcept,
} from "../../dto/blueprint/blueprint-document.dto.ts";

export interface RouteScope {
  id: string;
  method: string;
  path: string;
  filePath: string;
  line: number;
  relatedFiles: string[];
}

export function buildConceptsForRoutes(
  routes: RouteScope[],
  facts: CodeFact[],
): TechnicalConcept[] {
  const concepts: TechnicalConcept[] = [];

  for (const route of routes) {
    const scopeFacts = facts.filter((f) =>
      route.relatedFiles.includes(f.filePath)
    );
    const scopeId = route.id;

    concepts.push(
      makeConcept(scopeId, "api-route", "confirmed", 95, scopeFacts, [
        "api-route",
      ]),
      makeConcept(
        scopeId,
        "auth-gate",
        inferAuthState(scopeFacts),
        inferAuthConfidence(scopeFacts),
        scopeFacts,
        ["auth-check", "auth-deny-401"],
      ),
      makeConcept(
        scopeId,
        "validation-gate",
        inferValidationState(scopeFacts),
        inferValidationConfidence(scopeFacts),
        scopeFacts,
        ["schema-safe-parse", "schema-parse", "validation-deny-400"],
      ),
      makeConcept(
        scopeId,
        "rate-limit",
        hasKind(scopeFacts, "rate-limit") ? "confirmed" : "unknown",
        hasKind(scopeFacts, "rate-limit") ? 80 : 40,
        scopeFacts,
        ["rate-limit"],
      ),
      makeConcept(
        scopeId,
        "db-read",
        hasKind(scopeFacts, "db-read") ? "confirmed" : "missing",
        hasKind(scopeFacts, "db-read") ? 88 : 50,
        scopeFacts,
        ["db-read"],
      ),
      makeConcept(
        scopeId,
        "db-write",
        hasKind(scopeFacts, "db-write") ? "confirmed" : "missing",
        hasKind(scopeFacts, "db-write") ? 88 : 50,
        scopeFacts,
        ["db-write"],
      ),
      makeConcept(
        scopeId,
        "external-api",
        hasKind(scopeFacts, "external-api-call") ? "confirmed" : "missing",
        hasKind(scopeFacts, "external-api-call") ? 75 : 45,
        scopeFacts,
        ["external-api-call"],
      ),
    );
  }

  return concepts;
}

function makeConcept(
  scopeId: string,
  type: ConceptType,
  state: ConceptState,
  confidence: number,
  scopeFacts: CodeFact[],
  kinds: string[],
): TechnicalConcept {
  const evidence = scopeFacts.filter((f) => kinds.includes(f.kind));
  return {
    id: `${scopeId}:${type}`,
    type,
    state,
    confidence,
    scopeId,
    evidenceFactIds: evidence.map((f) => f.id),
    callPath: [...new Set(evidence.map((f) => f.filePath))],
  };
}

function hasKind(facts: CodeFact[], kind: string): boolean {
  return facts.some((f) => f.kind === kind);
}

function inferAuthState(facts: CodeFact[]): ConceptState {
  const hasCheck = hasKind(facts, "auth-check");
  const hasDeny = hasKind(facts, "auth-deny-401");
  if (hasCheck && hasDeny) return "confirmed";
  if (hasCheck) return "partial";
  if (hasDeny) return "weak";
  return "missing";
}

function inferAuthConfidence(facts: CodeFact[]): number {
  const s = inferAuthState(facts);
  if (s === "confirmed") return 85;
  if (s === "partial") return 65;
  if (s === "weak") return 50;
  return 55;
}

function inferValidationState(facts: CodeFact[]): ConceptState {
  const hasParse = hasKind(facts, "schema-safe-parse") ||
    hasKind(facts, "schema-parse");
  const has400 = hasKind(facts, "validation-deny-400");
  const hasBody = hasKind(facts, "request-body-read");
  if (hasParse && has400) return "confirmed";
  if (hasParse && hasBody) return "partial";
  if (hasParse) return "weak";
  if (hasBody) return "missing";
  return "unknown";
}

function inferValidationConfidence(facts: CodeFact[]): number {
  const s = inferValidationState(facts);
  if (s === "confirmed") return 87;
  if (s === "partial") return 70;
  if (s === "missing") return 75;
  if (s === "weak") return 55;
  return 40;
}
