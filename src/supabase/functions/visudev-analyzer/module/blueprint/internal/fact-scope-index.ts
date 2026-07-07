/** O(1) fact/concept lookups per route scope. */

import type {
  CodeFact,
  TechnicalConcept,
} from "../../dto/blueprint/blueprint-document.dto.ts";
import type { RouteScope } from "../services/concept-engine.service.ts";

export function indexFactsByFilePath(
  facts: CodeFact[],
): Map<string, CodeFact[]> {
  const factsByFile = new Map<string, CodeFact[]>();
  for (const fact of facts) {
    const fileFacts = factsByFile.get(fact.filePath);
    if (fileFacts) {
      fileFacts.push(fact);
    } else {
      factsByFile.set(fact.filePath, [fact]);
    }
  }
  return factsByFile;
}

export function scopeFactsForRoute(
  route: RouteScope,
  factsByFile: Map<string, CodeFact[]>,
): CodeFact[] {
  const scopedFacts: CodeFact[] = [];
  for (const filePath of route.relatedFiles) {
    const fileFacts = factsByFile.get(filePath);
    if (fileFacts) scopedFacts.push(...fileFacts);
  }
  return scopedFacts;
}

export function indexConceptsByScope(
  concepts: TechnicalConcept[],
): Map<string, Map<string, TechnicalConcept>> {
  const conceptsByScope = new Map<string, Map<string, TechnicalConcept>>();
  for (const concept of concepts) {
    let typeMap = conceptsByScope.get(concept.scopeId);
    if (!typeMap) {
      typeMap = new Map();
      conceptsByScope.set(concept.scopeId, typeMap);
    }
    typeMap.set(concept.type, concept);
  }
  return conceptsByScope;
}
