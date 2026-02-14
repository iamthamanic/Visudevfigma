/**
 * Log create validation. Strict whitelist (message, level). At least one of message/level
 * required so stored entries are not empty and remain queryable.
 */
import { z } from "zod";

export const createLogBodySchema = z
  .object({
    message: z.string().max(10_000).optional(),
    level: z.enum(["info", "warn", "error", "debug"]).optional(),
  })
  .strict()
  .refine((obj) => (obj.message ?? "").length > 0 || obj.level != null, {
    message: "At least one of message or level is required",
  })
  .refine((obj) => JSON.stringify(obj).length <= 50_000, {
    message: "Log payload too large",
  });
