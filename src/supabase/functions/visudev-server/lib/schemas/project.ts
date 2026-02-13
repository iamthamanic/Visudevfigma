/**
 * Project create/update validation. Strict whitelist to prevent mass assignment.
 */
import { z } from "zod";

export const createProjectBodySchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().max(500).optional(),
    description: z.string().max(2000).optional(),
    github_repo: z.string().max(500).optional(),
    github_branch: z.string().max(200).optional(),
    preview_mode: z.enum(["auto", "local", "central", "deployed"]).optional(),
    database_type: z.enum(["supabase", "local"]).optional(),
    supabase_project_id: z.string().max(100).optional(),
  })
  .strict();

export const updateProjectBodySchema = z
  .object({
    name: z.string().max(500).optional(),
    github_repo: z.string().max(500).optional(),
    supabase_project_id: z.string().max(100).optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: "Update body must contain at least one field",
  });
