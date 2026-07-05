import { z } from "zod";

export const blueprintRequestSchema = z.object({
  access_token: z.string().min(1).optional(),
  repo: z.string().min(1, "repo is required").trim(),
  branch: z.string().min(1, "branch is required").trim(),
  projectId: z.string().min(1, "projectId is required").trim(),
});

export type BlueprintRequestInput = z.infer<typeof blueprintRequestSchema>;
