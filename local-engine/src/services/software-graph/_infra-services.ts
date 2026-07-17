/**
 * Infra service helpers (compose + Prisma datasource) for graph promotion.
 * Location: local-engine/src/services/software-graph/_infra-services.ts
 */

import type { RawBlueprintFact } from "../../types/api.types.js";

export function isInfraServiceFact(fact: RawBlueprintFact): boolean {
  return (
    fact.kind === "infra-service" &&
    typeof fact.metadata?.service === "string" &&
    fact.metadata.service.trim().length > 0
  );
}

/** Stable infra engine node id (PostgreSQL / Redis / …). */
export function infraServiceNodeId(service: string): string {
  const slug = service
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `infra:${slug || "service"}`;
}

export function partitionInfraServiceFacts(facts: RawBlueprintFact[]): {
  infraServices: RawBlueprintFact[];
  other: RawBlueprintFact[];
} {
  const infraServices: RawBlueprintFact[] = [];
  const other: RawBlueprintFact[] = [];
  for (const fact of facts) {
    if (isInfraServiceFact(fact)) infraServices.push(fact);
    else other.push(fact);
  }
  return { infraServices, other };
}
