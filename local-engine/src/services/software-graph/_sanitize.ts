/**
 * Sanitizes fact excerpts and metadata before they enter the Software Graph.
 *
 * Excerpts are truncated to a safe length. Long base64-like blobs,
 * high-entropy tokens, and private keys are masked while ordinary
 * source identifiers remain readable.
 */

import type { SoftwareGraphEvidence } from "../../types/api.types.js";

const MAX_EXCERPT_LENGTH = 200;
const SENSITIVE_KEY_RE =
  /(password|passwd|secret|token|credential|privateKey|apiKey|accessToken|refreshToken|authHeader|bearer|client_secret|private_key)$/i;
const HIGH_ENTROPY_RE =
  /\b[a-zA-Z0-9+/]{32,}={0,2}\b|[A-Za-z0-9_-]{40,}|-----BEGIN [A-Z ]+ KEY-----|sk-[a-zA-Z0-9]{48,}/g;
const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;

export function sanitizeExcerpt(snippet: string | undefined): SoftwareGraphEvidence["excerpt"] {
  if (!snippet) return "";
  let excerpt =
    snippet.length > MAX_EXCERPT_LENGTH ? `${snippet.slice(0, MAX_EXCERPT_LENGTH)}…` : snippet;
  excerpt = excerpt.replace(EMAIL_RE, "[EMAIL]");
  excerpt = excerpt.replace(HIGH_ENTROPY_RE, "***");
  return excerpt;
}

export function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (SENSITIVE_KEY_RE.test(key)) continue;
    if (typeof value === "string") {
      out[key] = value.replace(HIGH_ENTROPY_RE, "***").replace(EMAIL_RE, "[EMAIL]");
    } else if (value && typeof value === "object" && !Array.isArray(value)) {
      out[key] = sanitizeMetadata(value as Record<string, unknown>);
    } else {
      out[key] = value;
    }
  }
  return out;
}
