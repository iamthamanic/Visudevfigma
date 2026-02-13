/**
 * Account update validation. Validates displayName, email and payload size.
 */
import { z } from "zod";

export const updateAccountBodySchema = z
  .object({
    displayName: z.string().max(200).optional(),
    email: z.string().email().max(320).optional(),
  })
  .passthrough()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Update body must contain at least one field",
  })
  .refine(
    (obj) => JSON.stringify(obj).length <= 20_000,
    { message: "Account payload too large" },
  );
