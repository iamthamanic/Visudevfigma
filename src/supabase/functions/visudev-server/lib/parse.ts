/**
 * Request body parsing helper. Single responsibility: JSON parse + Zod validation.
 *
 * Centralized so invalid JSON or schema violations return 400 (client error) instead of
 * 500 (server error), giving clients actionable feedback. Trade-off: all routes must
 * pass a schema; benefit is consistent error shape and no try/catch parse in handlers.
 */
import type { Context } from "hono";
import type { z } from "zod";

export async function parseJsonBody<T>(
  c: Context,
  schema: z.ZodType<T>,
): Promise<
  | { ok: true; data: T }
  | { ok: false; status: 400; error: string }
> {
  let raw: unknown;
  try {
    raw = await c.req.json();
  } catch {
    return { ok: false, status: 400, error: "Invalid JSON" };
  }
  const parsed = schema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, status: 400, error: parsed.error.message };
  }
  return { ok: true, data: parsed.data };
}
