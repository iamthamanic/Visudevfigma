import { z } from "zod";
import { localPathSchema } from "./local-path.validator.ts";

export const projectIdSchema = z.string().min(1, "project id is required")
  .trim();

const sourceModeSchema = z.enum(["github", "local"]);
const previewModeSchema = z.enum(["auto", "local", "central", "deployed"]);
const githubRepoSchema = z
  .string()
  .max(512)
  .regex(/^[\w.-]+\/[\w.-]+$/, "github_repo must be owner/repo");
const deployedUrlSchema = z.union([z.string().url(), z.literal("")]);

const projectFieldsSchema = z
  .object({
    id: z.union([z.string().min(1).trim(), z.undefined(), z.null()]).optional(),
    name: z.string().max(256).optional(),
    source_mode: sourceModeSchema.optional(),
    local_path: z.string().optional(),
    github_repo: githubRepoSchema.optional(),
    github_branch: z.string().max(128).optional(),
    github_access_token: z.string().max(4096).optional(),
    deployed_url: deployedUrlSchema.optional(),
    preview_mode: previewModeSchema.optional(),
    database_type: z.enum(["supabase", "local"]).optional(),
    supabase_project_id: z.string().max(128).optional(),
    supabase_anon_key: z.string().max(4096).optional(),
    supabase_management_token: z.string().max(4096).optional(),
    description: z.string().max(4096).optional(),
  })
  .strict()
  .superRefine((body, ctx) => {
    const mode = body.source_mode ??
      (body.local_path ? "local" : body.github_repo ? "github" : undefined);
    if (mode === "local") {
      const localResult = localPathSchema.safeParse(body.local_path ?? "");
      if (!localResult.success) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["local_path"],
          message: localResult.error.issues[0]?.message ?? "Invalid local_path",
        });
      }
    }
    if (mode === "github" && !body.github_repo?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["github_repo"],
        message: "github_repo is required for github source_mode",
      });
    }
  });

export const createProjectBodySchema = projectFieldsSchema;
export const updateProjectBodySchema = projectFieldsSchema.partial();

export type ProjectIdInput = z.infer<typeof projectIdSchema>;
export type CreateProjectBodyInput = z.infer<typeof createProjectBodySchema>;
export type UpdateProjectBodyInput = z.infer<typeof updateProjectBodySchema>;
