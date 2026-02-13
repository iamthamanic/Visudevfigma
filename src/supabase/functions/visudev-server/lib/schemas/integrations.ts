/**
 * Integrations update validation. Validates github/supabase structure and payload size.
 */
import { z } from "zod";

const githubIntegrationSchema = z
  .object({
    token: z.string().max(500).optional(),
  })
  .optional();

const supabaseIntegrationSchema = z
  .object({
    url: z.string().url().max(500).optional(),
    serviceKey: z.string().max(2000).optional(),
    projectRef: z.string().max(100).optional(),
  })
  .optional();

export const updateIntegrationsBodySchema = z
  .object({
    github: githubIntegrationSchema,
    supabase: supabaseIntegrationSchema,
  })
  .passthrough()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Update body must contain at least one field",
  })
  .refine(
    (obj) => JSON.stringify(obj).length <= 50_000,
    { message: "Integrations payload too large" },
  );
