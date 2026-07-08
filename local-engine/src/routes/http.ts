/**
 * API response helpers for Local Engine routes.
 * Location: local-engine/src/routes/http.ts
 */

import type { Context } from "hono";
import type { ApiResponse } from "../types/api.types.js";

export function ok<T>(c: Context, data: T, status = 200) {
  const payload: ApiResponse<T> = { ok: true, data };
  return c.json(payload, status as 200);
}

export function fail(c: Context, code: string, message: string, status = 400, details?: unknown) {
  const payload: ApiResponse<never> = {
    ok: false,
    error: { code, message, details },
  };
  return c.json(payload, status as 400);
}

export function getErrorStatus(error: unknown, fallback = 500): number {
  if (error && typeof error === "object" && "statusCode" in error) {
    const statusCode = Number((error as { statusCode?: number }).statusCode);
    if (Number.isFinite(statusCode)) return statusCode;
  }
  if (error instanceof Error && error.message === "Project not found") return 404;
  if (error instanceof Error && error.message === "Analysis run not found") return 404;
  return fallback;
}
