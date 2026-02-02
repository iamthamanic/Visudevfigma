import { z } from "zod";

export const projectIdSchema = z.string().min(1, "project id is required")
  .trim();

export const updateIntegrationsSchema = z.record(z.unknown());

export const connectGitHubSchema = z.object({
  token: z.string().min(1, "token is required").trim(),
  username: z.string().min(1).optional(),
});

export const connectSupabaseSchema = z.object({
  url: z.string().min(1, "url is required").trim(),
  anonKey: z.string().min(1, "anonKey is required").trim(),
  serviceKey: z.string().min(1).optional(),
  projectRef: z.string().min(1).optional(),
});

export const githubOwnerSchema = z.string().min(1, "owner is required").trim();
export const githubRepoSchema = z.string().min(1, "repo is required").trim();
export const githubPathSchema = z.string().optional();
export const githubRefSchema = z.string().min(1).optional();

export type ProjectIdInput = z.infer<typeof projectIdSchema>;
export type UpdateIntegrationsInput = z.infer<typeof updateIntegrationsSchema>;
export type ConnectGitHubInput = z.infer<typeof connectGitHubSchema>;
export type ConnectSupabaseInput = z.infer<typeof connectSupabaseSchema>;
