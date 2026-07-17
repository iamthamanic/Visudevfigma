/**
 * Prisma schema-model helpers for graph table-node promotion (visudev-gapclose P2-1).
 * Location: local-engine/src/services/software-graph/_prisma-models.ts
 */

import type { RawBlueprintFact } from "../../types/api.types.js";

/** True when fact is a model emitted from a parsed schema.prisma (not a runtime query). */
export function isPrismaSchemaModelFact(fact: RawBlueprintFact): boolean {
  return (
    fact.kind === "db-write" &&
    fact.metadata?.framework === "prisma" &&
    fact.metadata?.operation === "prisma-model"
  );
}

/** Stable graph node id for a Prisma table so models dedupe across facts. */
export function prismaTableNodeId(table: string): string {
  return `table:prisma:${table.trim()}`;
}

export function partitionPrismaModelFacts(facts: RawBlueprintFact[]): {
  prismaModels: RawBlueprintFact[];
  other: RawBlueprintFact[];
} {
  const prismaModels: RawBlueprintFact[] = [];
  const other: RawBlueprintFact[] = [];
  for (const fact of facts) {
    if (isPrismaSchemaModelFact(fact)) prismaModels.push(fact);
    else other.push(fact);
  }
  return { prismaModels, other };
}
