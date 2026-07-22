/**
 * Why: centralize which service messages may surface in UI so hooks do not
 * each own error-policy and adapter failures never leak secrets.
 */
const KNOWN_CLIENT_ERROR_MARKERS = [
  "No project ID",
  "Invalid project payload",
  "Project payload too large",
  "Project payload is empty",
  "Project name is required",
  "Unexpected field:",
  "must be a string",
  "must not be empty",
  "too long",
  "Invalid source_mode",
  "Invalid preview_mode",
  "Invalid database_type",
  "Invalid blueprint_provider_id",
  "Invalid project id",
] as const;

export function toSafeClientError(message: string | undefined, fallback: string): string {
  if (!message) return fallback;
  if (KNOWN_CLIENT_ERROR_MARKERS.some((marker) => message.includes(marker))) {
    return message;
  }
  return fallback;
}

export function logProjectsAdapterFailure(operation: string, cause: unknown): void {
  const detail = cause instanceof Error ? cause.message : "unknown failure";
  console.error(`[projects.api-adapter] ${operation} failed:`, detail);
}
