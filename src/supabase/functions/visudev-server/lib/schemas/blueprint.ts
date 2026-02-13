/**
 * Blueprint update validation. Strict whitelist (components, violations, cycles)
 * to prevent mass assignment.
 */
import { z } from "zod";

const blueprintComponentSchema = z.object({
  name: z.string().max(200),
  type: z.string().max(100).optional(),
  path: z.string().max(500).optional(),
});

const violationSchema = z.object({
  ruleId: z.string().max(100),
  severity: z.enum(["error", "warn", "info"]),
  source: z.string().max(500),
  target: z.string().max(500).optional(),
  message: z.string().max(1000),
});

const cycleSchema = z.object({
  nodes: z.array(z.string().max(200)).max(100),
  message: z.string().max(500).optional(),
});

export const updateBlueprintBodySchema = z
  .object({
    components: z.array(blueprintComponentSchema).max(500).optional(),
    violations: z.array(violationSchema).max(100).optional(),
    cycles: z.array(cycleSchema).max(50).optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Update body must contain at least one field",
  })
  .refine((obj) => JSON.stringify(obj).length <= 100_000, {
    message: "Blueprint payload too large",
  });
