import { z } from "zod";

export const projectIdSchema = z.string().min(1, "project id is required")
  .trim();
export const createProjectBodySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().max(500).optional(),
}).passthrough();
export const updateProjectBodySchema = z.object({
  name: z.string().max(500).optional(),
}).passthrough();

export type ProjectIdInput = z.infer<typeof projectIdSchema>;
export type CreateProjectBodyInput = z.infer<typeof createProjectBodySchema>;
export type UpdateProjectBodyInput = z.infer<typeof updateProjectBodySchema>;
