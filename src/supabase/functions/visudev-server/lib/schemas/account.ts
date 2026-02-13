/**
 * Account update validation. Strict whitelist (displayName, email only)
 * to prevent mass assignment; at least one field required.
 */
import { z } from "zod";

export const updateAccountBodySchema = z
  .object({
    displayName: z.string().max(200).optional(),
    email: z.string().email().max(320).optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Update body must contain at least one field",
  });
