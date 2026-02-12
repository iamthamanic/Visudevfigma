/**
 * Request body schemas for visudev-server. Single responsibility: input validation.
 */
import { z } from "zod";

export const createProjectBodySchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().max(500).optional(),
  })
  .passthrough();

export const createLogBodySchema = z
  .object({
    message: z.string().max(10_000).optional(),
    level: z.enum(["info", "warn", "error", "debug"]).optional(),
  })
  .passthrough();

export const updateIntegrationsBodySchema = z
  .record(z.unknown())
  .refine(
    (obj) =>
      Object.keys(obj).length <= 20 && JSON.stringify(obj).length <= 50_000,
    { message: "Integrations payload too large" },
  );

export const updateAccountBodySchema = z
  .record(z.unknown())
  .refine(
    (obj) => JSON.stringify(obj).length <= 20_000,
    { message: "Account payload too large" },
  );
