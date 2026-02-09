import { z } from "zod";

export const projectIdSchema = z.string().min(1, "projectId is required")
  .trim();

export const schemaBodySchema = z.record(z.unknown());

export const migrationsBodySchema = z.array(z.unknown());

export const erdBodySchema = z.record(z.unknown());

export type ProjectIdInput = z.infer<typeof projectIdSchema>;
export type SchemaBodyInput = z.infer<typeof schemaBodySchema>;
export type MigrationsBodyInput = z.infer<typeof migrationsBodySchema>;
export type ErdBodyInput = z.infer<typeof erdBodySchema>;
