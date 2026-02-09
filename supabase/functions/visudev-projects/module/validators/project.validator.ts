import { z } from "zod";

export const projectIdSchema = z.string().min(1, "project id is required")
  .trim();
export const createProjectBodySchema = z.record(z.unknown());
export const updateProjectBodySchema = z.record(z.unknown());

export type ProjectIdInput = z.infer<typeof projectIdSchema>;
export type CreateProjectBodyInput = z.infer<typeof createProjectBodySchema>;
export type UpdateProjectBodyInput = z.infer<typeof updateProjectBodySchema>;
