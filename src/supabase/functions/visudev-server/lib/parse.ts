/**
 * Request body parsing helper. Single responsibility: JSON parse + Zod validation.
 * Rationale: Centralizing parse/validate yields consistent 400 responses for invalid input
 * (instead of 500 from generic catch) and keeps route handlers focused on business logic.
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
