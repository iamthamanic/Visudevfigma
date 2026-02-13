/**
 * Request body parsing helper. Single responsibility: JSON parse + Zod validation.
 *
 * Why centralized: Invalid JSON or schema violations return 400 (client error) instead of
 * 500 (server error), so clients get actionable feedback. Route handlers stay focused
 * on business logic instead of parsing/validation boilerplate.
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
