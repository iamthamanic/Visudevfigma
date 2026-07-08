/** Fact metadata allowlist and string-only redaction for Blueprint export. */

import { redactPiiInText, sanitizeUrlForExport } from "./snippet-sanitizer.ts";

const MAX_METADATA_STRING_LEN = 64;

const ALLOWED_METADATA_KEYS = new Set([
  "method",
  "path",
  "framework",
  "table",
  "operation",
  "status",
]);

function normalizeMetadataKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]+/g, "_");
}

function looksSensitiveMetadataValue(value: string): boolean {
  if (value.length > MAX_METADATA_STRING_LEN) return true;
  return /@[a-z0-9.-]+\.[a-z]{2,}|\+?\d{10,}|[0-9a-f]{32,}|\d{3}-\d{2}-\d{4}/i
    .test(value);
}

function sanitizeMetadataString(key: string, value: string): string {
  const normalizedKey = normalizeMetadataKey(key);
  let next = redactPiiInText(value.trim());
  if (normalizedKey === "path") {
    next = /^https?:\/\//i.test(next)
      ? sanitizeUrlForExport(next)
      : next.slice(0, MAX_METADATA_STRING_LEN);
  }
  if (looksSensitiveMetadataValue(next)) return "***";
  return next.slice(0, MAX_METADATA_STRING_LEN);
}

export function sanitizeFactMetadataForExport(
  metadata: Record<string, unknown>,
): Record<string, unknown> {
  const next: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    const normalizedKey = normalizeMetadataKey(key);
    if (!ALLOWED_METADATA_KEYS.has(normalizedKey)) continue;
    if (typeof value !== "string") continue;
    next[key] = sanitizeMetadataString(key, value);
  }
  return next;
}
