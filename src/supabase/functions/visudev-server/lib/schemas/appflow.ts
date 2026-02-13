/**
 * AppFlow create validation. Validates flowId and payload size.
 */
import { z } from "zod";

export const createAppFlowBodySchema = z
  .object({
    flowId: z.string().uuid().optional(),
  })
  .passthrough()
  .refine((obj) => JSON.stringify(obj).length <= 200_000, {
    message: "AppFlow payload too large",
  });
