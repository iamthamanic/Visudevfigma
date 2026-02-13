/**
 * Log create validation. Strict whitelist (message, level) with payload size limit.
 */
import { z } from "zod";

export const createLogBodySchema = z
  .object({
    message: z.string().max(10_000).optional(),
    level: z.enum(["info", "warn", "error", "debug"]).optional(),
  })
  .strict()
  .refine((obj) => JSON.stringify(obj).length <= 50_000, {
    message: "Log payload too large",
  });
