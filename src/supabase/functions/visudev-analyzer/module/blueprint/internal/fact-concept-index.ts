/** TechnicalConcept lookup by scope and concept type. */

import type { TechnicalConcept } from "../../dto/blueprint/blueprint-document.dto.ts";

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
