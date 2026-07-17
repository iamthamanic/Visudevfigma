/**
 * Tests for Prisma schema-model helpers (visudev-gapclose P2-1).
 * Location: local-engine/src/services/software-graph/_prisma-models.test.ts
 */

import { describe, expect, it } from "vitest";
import {
  isPrismaSchemaModelFact,
  partitionPrismaModelFacts,
  prismaTableNodeId,
} from "./_prisma-models.js";
import type { RawBlueprintFact } from "../../types/api.types.js";

function fact(
  partial: Partial<RawBlueprintFact> & Pick<RawBlueprintFact, "id" | "kind">,
): RawBlueprintFact {
  return {
    filePath: "prisma/schema.prisma",
    line: 1,
    snippet: "",
    metadata: {},
    ...partial,
  };
}

describe("prisma model helpers", () => {
  it("detects prisma-model facts only", () => {
    expect(
      isPrismaSchemaModelFact(
        fact({
          id: "1",
          kind: "db-write",
          metadata: { table: "LeaveRequest", operation: "prisma-model", framework: "prisma" },
        }),
      ),
    ).toBe(true);
    expect(
      isPrismaSchemaModelFact(
        fact({
          id: "2",
          kind: "db-write",
          metadata: { table: "LeaveRequest", framework: "prisma" },
        }),
      ),
    ).toBe(false);
  });

  it("partitions models ahead of other facts", () => {
    const { prismaModels, other } = partitionPrismaModelFacts([
      fact({ id: "a", kind: "auth-check" }),
      fact({
        id: "b",
        kind: "db-write",
        metadata: { table: "User", operation: "prisma-model", framework: "prisma" },
      }),
      fact({ id: "c", kind: "db-read", metadata: { table: "User" } }),
    ]);
    expect(prismaModels.map((f) => f.id)).toEqual(["b"]);
    expect(other.map((f) => f.id)).toEqual(["a", "c"]);
  });

  it("builds stable table node ids", () => {
    expect(prismaTableNodeId("LeaveRequest")).toBe("table:prisma:LeaveRequest");
  });
});
