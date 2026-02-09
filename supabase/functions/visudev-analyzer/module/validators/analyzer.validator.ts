import { z } from "zod";

export const analysisRequestSchema = z.object({
  access_token: z.string().min(1).optional(),
  repo: z.string().min(1, "repo is required").trim(),
  branch: z.string().min(1, "branch is required").trim(),
});

export const analysisIdSchema = z.string().min(1, "analysis id is required")
  .trim();

export const screenInputSchema = z
  .object({
    id: z.string().min(1, "screen id is required").trim(),
    name: z.string().min(1, "screen name is required").trim(),
    path: z.string().min(1, "screen path is required").trim(),
  })
  .passthrough();

export const screenshotRequestSchema = z.object({
  projectId: z.string().min(1, "projectId is required").trim(),
  baseUrl: z.string().min(1, "baseUrl is required").url(),
  screens: z.array(screenInputSchema).min(1, "screens is required"),
});

export type AnalysisRequestInput = z.infer<typeof analysisRequestSchema>;
export type ScreenshotRequestInput = z.infer<typeof screenshotRequestSchema>;
