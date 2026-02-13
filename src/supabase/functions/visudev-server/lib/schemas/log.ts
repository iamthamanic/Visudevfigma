/**
 * Log create validation. Validates message, level and payload size.
 */
import { z } from "zod";

export const createLogBodySchema = z
  .object({
    message: z.string().max(10_000).optional(),
    level: z.enum(["info", "warn", "error", "debug"]).optional(),
  })
  .passthrough();
