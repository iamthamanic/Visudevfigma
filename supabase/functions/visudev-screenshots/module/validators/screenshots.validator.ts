import { z } from "zod";

export const screenInputSchema = z.object({
  id: z.string().min(1, "screen id is required").trim(),
  path: z.string().min(1, "screen path is required").trim(),
});

export const captureRequestSchema = z.object({
  deployedUrl: z.string().min(1, "deployedUrl is required").url(),
  repo: z.string().min(1).optional(),
  commitSha: z.string().min(1).optional(),
  routePrefix: z.string().min(1).optional(),
  screens: z.array(screenInputSchema).min(1, "screens is required"),
});

export type CaptureRequestInput = z.infer<typeof captureRequestSchema>;
