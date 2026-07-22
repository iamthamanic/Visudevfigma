/**
 * Why: centralize which service messages may surface in UI so hooks do not
 * each own error-policy and adapter failures never leak secrets.
 */
const KNOWN_CLIENT_ERROR_MARKERS = [
  "No project ID",
  "Invalid blueprint payload",
  "Blueprint payload too large",
  "Blueprint payload is empty",
  "Unexpected field:",
] as const;

export function toSafeClientError(message: string | undefined, fallback: string): string {
  if (!message) return fallback;
  if (KNOWN_CLIENT_ERROR_MARKERS.some((marker) => message.includes(marker))) {
    return message;
  }
  return fallback;
}

export function logBlueprintAdapterFailure(operation: string, cause: unknown): void {
  const detail = cause instanceof Error ? cause.message : "unknown failure";
  console.error(`[blueprint.api-adapter] ${operation} failed:`, detail);
}
