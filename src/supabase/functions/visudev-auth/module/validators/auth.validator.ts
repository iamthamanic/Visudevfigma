import { z } from "zod";

export const githubAuthorizeQuerySchema = z.object({
  return_url: z.string().min(1).optional(),
});

export const githubCallbackQuerySchema = z.object({
  code: z.string().min(1, "code is required").trim(),
  state: z.string().min(1).optional(),
});

export const githubSessionSchema = z.object({
  state: z.string().min(1, "state is required").trim(),
});

export const githubReposSchema = z.object({
  access_token: z.string().min(1, "access_token is required").trim(),
});

export const supabaseTokenSchema = z.object({
  management_token: z.string().min(1, "management_token is required").trim(),
});

export type GitHubSessionInput = z.infer<typeof githubSessionSchema>;
export type GitHubReposInput = z.infer<typeof githubReposSchema>;
export type SupabaseTokenInput = z.infer<typeof supabaseTokenSchema>;
