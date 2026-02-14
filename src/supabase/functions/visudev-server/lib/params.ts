/**
 * Route param validation. Bounds length and format of userId, projectId, flowId
 * before use in auth/KV keys (prevents oversized keys and abuse).
 * Use parseParam in handlers or withValidatedParam to centralise validation and 400 response.
 */
import type { Context } from "hono";
import { z } from "zod";

const MAX_ID_LEN = 200;

/** Project or resource id: UUID or alphanumeric + hyphen/underscore. */
export const projectIdParamSchema = z
  .string()
  .min(1)
  .max(MAX_ID_LEN)
  .regex(/^[a-zA-Z0-9_-]+$/, "Invalid id format");

export const flowIdParamSchema = projectIdParamSchema;

/** User ID (auth): UUID or bounded string. */
export const userIdParamSchema = z
  .string()
  .min(1)
  .max(MAX_ID_LEN);

export function parseParam<T>(
  value: string | undefined,
  schema: z.ZodType<T>,
): { ok: true; data: T } | { ok: false; error: string } {
  const r = schema.safeParse(value ?? "");
  if (r.success) return { ok: true, data: r.data };
  return { ok: false, error: r.error.message };
}

/**
 * Run a handler with a validated route param; returns 400 if invalid.
 * Consolidates parseParam + 400 response so handlers stay thin.
 */
export async function withValidatedParam<T, E>(
  c: Context<E>,
  paramKey: string,
  schema: z.ZodType<T>,
  fn: (value: T) => Promise<Response> | Response,
): Promise<Response> {
  const result = parseParam(c.req.param(paramKey), schema);
  if (!result.ok) return c.json({ success: false, error: result.error }, 400);
  return await fn(result.data);
}
