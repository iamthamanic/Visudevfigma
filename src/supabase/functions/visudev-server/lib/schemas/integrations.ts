/**
 * Integrations update validation. Strict whitelist (github, supabase only)
 * to prevent mass assignment; size limit prevents abuse.
 */
import { z } from "zod";

/** GitHub repo path segment: alphanumeric, hyphens, underscores, dots */
const repoPartSchema = z
  .string()
  .min(1, "Required")
  .max(200)
  .regex(/^[a-zA-Z0-9._-]+$/, "Invalid format");

/** File path: alphanumeric, slashes, dots, hyphens, underscores */
const filePathSchema = z
  .string()
  .min(1, "Required")
  .max(500)
  .regex(/^[a-zA-Z0-9/._-]+$/, "Invalid path format");

export const githubContentQuerySchema = z.object({
  owner: repoPartSchema,
  repo: repoPartSchema,
  path: filePathSchema,
  ref: z.string().max(200).regex(/^[a-zA-Z0-9/._-]+$/).optional(),
});

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
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Update body must contain at least one field",
  })
  .refine(
    (obj) => JSON.stringify(obj).length <= 50_000,
    { message: "Integrations payload too large" },
  );
