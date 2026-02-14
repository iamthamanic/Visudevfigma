/**
 * Data schema validation. Only "tables" is allowed (strict whitelist) so the frontend
 * cannot persist arbitrary keys into KV; we avoid schema drift and key injection.
 */
import { z } from "zod";

const tableColumnSchema = z.union([
  z.string().max(200),
  z.object({ name: z.string().max(200), type: z.string().max(100).optional() }),
]);

const dataTableSchema = z.object({
  name: z.string().max(200),
  columns: z.array(tableColumnSchema).max(100).optional(),
});

export const updateDataSchemaBodySchema = z
  .object({
    tables: z.array(dataTableSchema).max(500).optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Update body must contain at least one field",
  })
  .refine((obj) => JSON.stringify(obj).length <= 100_000, {
    message: "Data schema payload too large",
  });

const migrationItemSchema = z
  .object({
    id: z.string().max(200).optional(),
    name: z.string().max(300).optional(),
    sql: z.string().max(100_000).optional(),
  })
  .refine(
    (obj) =>
      (typeof obj.name === "string" && obj.name.length > 0) ||
      (typeof obj.sql === "string" && obj.sql.length > 0),
    { message: "Each migration must have non-empty name or sql" },
  );

export const updateMigrationsBodySchema = z
  .array(migrationItemSchema)
  .max(200)
  .refine((arr) => JSON.stringify(arr).length <= 500_000, {
    message: "Migrations payload too large",
  });
