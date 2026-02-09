import { z } from "zod";

export const projectIdSchema = z.string().min(1, "project id is required")
  .trim();
export const logIdSchema = z.string().min(1, "log id is required").trim();
export const createLogBodySchema = z.record(z.unknown());

export type ProjectIdInput = z.infer<typeof projectIdSchema>;
export type LogIdInput = z.infer<typeof logIdSchema>;
export type CreateLogBodyInput = z.infer<typeof createLogBodySchema>;
