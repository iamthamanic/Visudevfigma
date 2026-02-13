/**
 * Blueprint update validation. Validates components and payload size.
 */
import { z } from "zod";

const blueprintComponentSchema = z.object({
  name: z.string().max(200),
  type: z.string().max(100).optional(),
  path: z.string().max(500).optional(),
});

export const updateBlueprintBodySchema = z
  .object({
    components: z.array(blueprintComponentSchema).max(500).optional(),
  })
  .passthrough()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Update body must contain at least one field",
  })
  .refine((obj) => JSON.stringify(obj).length <= 100_000, {
    message: "Blueprint payload too large",
  });
