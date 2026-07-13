/**
 * Sanitization helpers to prevent leakage of raw source lines or secrets into the graph.
 *
 * Design decisions:
 * - Keep short excerpts instead of full lines to limit accidental secret exposure.
 * - Mask common secret patterns inside the excerpt itself.
 * - Strip or trim metadata values recursively; drop keys that look like credentials.
 */

const MAX_EXCERPT_LENGTH = 120;

const SECRET_PATTERNS: RegExp[] = [
  /[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
  /(?<=\b)[A-Za-z0-9_]{16,}(?=["'\s;,]|$)/g,
  /[A-Za-z0-9+/]{40,}={0,2}/g,
];

export function sanitizeExcerpt(snippet: string): string {
  if (!snippet) return "";
  let trimmed = snippet.trim().replace(/\s+/g, " ");
  for (const pattern of SECRET_PATTERNS) {
    trimmed = trimmed.replace(pattern, "***");
  }
  return trimmed.length > MAX_EXCERPT_LENGTH ? `${trimmed.slice(0, MAX_EXCERPT_LENGTH)}…` : trimmed;
}

const UNSAFE_KEY_RE =
  /password|secret|token|key|credential|auth|private|api[_-]?key|access[_-]?token/i;

function isUnsafeKey(key: string): boolean {
  return UNSAFE_KEY_RE.test(key);
}

function sanitizeValue(value: unknown): unknown {
  if (typeof value === "string") {
    let masked = value;
    for (const pattern of SECRET_PATTERNS) {
      masked = masked.replace(pattern, "***");
    }
    return masked.length > 200 ? `${masked.slice(0, 200)}…` : masked;
  }
  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }
  if (value && typeof value === "object") {
    return sanitizeMetadata(value as Record<string, unknown>);
  }
  return value;
}

/** Public metadata only; excludes raw snippets, full credentials, or PII keys. */
export function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (isUnsafeKey(key)) continue;
    result[key] = sanitizeValue(value);
  }
  return result;
}
