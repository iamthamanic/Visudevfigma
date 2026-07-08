/**
 * Normalized API errors for VisuDevApiClient consumers.
 * Location: src/lib/visudev-api/errors.ts
 */

export class VisuDevApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly source: "local" | "supabase" | "client",
    readonly details?: unknown,
  ) {
    super(message);
    this.name = "VisuDevApiError";
  }
}
