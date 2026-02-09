import {
  erdBodySchema,
  migrationsBodySchema,
  projectIdSchema,
  schemaBodySchema,
} from "../validators/data.validator.ts";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEquals<T>(actual: T, expected: T, message?: string): void {
  if (actual !== expected) {
    throw new Error(
      message ?? `Expected ${String(actual)} to equal ${String(expected)}`,
    );
  }
}

Deno.test("projectIdSchema accepts non-empty string", () => {
  const value = projectIdSchema.parse("project-123");
  assertEquals(value, "project-123");
});

Deno.test("projectIdSchema rejects empty string", () => {
  let threw = false;
  try {
    projectIdSchema.parse("");
  } catch {
    threw = true;
  }
  assert(threw, "Expected projectIdSchema to throw for empty string");
});

Deno.test("schemaBodySchema accepts object payload", () => {
  const payload = { tables: ["users"] };
  const value = schemaBodySchema.parse(payload);
  assertEquals(value.tables[0], "users");
});

Deno.test("schemaBodySchema rejects non-object payload", () => {
  let threw = false;
  try {
    schemaBodySchema.parse("invalid");
  } catch {
    threw = true;
  }
  assert(threw, "Expected schemaBodySchema to throw for non-object payload");
});

Deno.test("migrationsBodySchema accepts array payload", () => {
  const payload = [{ id: "001_init" }];
  const value = migrationsBodySchema.parse(payload);
  assert(
    Array.isArray(value),
    "Expected migrationsBodySchema to return an array",
  );
});

Deno.test("migrationsBodySchema rejects non-array payload", () => {
  let threw = false;
  try {
    migrationsBodySchema.parse({ id: "001_init" });
  } catch {
    threw = true;
  }
  assert(threw, "Expected migrationsBodySchema to throw for non-array payload");
});

Deno.test("erdBodySchema accepts object payload", () => {
  const payload = { nodes: [] };
  const value = erdBodySchema.parse(payload);
  assertEquals(Array.isArray(value.nodes), true);
});

Deno.test("erdBodySchema rejects non-object payload", () => {
  let threw = false;
  try {
    erdBodySchema.parse(123);
  } catch {
    threw = true;
  }
  assert(threw, "Expected erdBodySchema to throw for non-object payload");
});
