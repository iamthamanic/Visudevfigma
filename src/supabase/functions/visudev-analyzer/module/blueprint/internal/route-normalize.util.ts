/** Shared route/path normalization for Blueprint scopes and graph mappers. */

const MAX_LABEL_LEN = 120;

export function normalizeGraphLabel(raw: unknown, fallback: string): string {
  const text = String(raw ?? "").trim().slice(0, MAX_LABEL_LEN);
  return text.length > 0 ? text : fallback;
}

export function normalizeHttpMethod(raw: unknown): string {
  const method = normalizeGraphLabel(raw, "GET").toUpperCase();
  return /^[A-Z]{2,12}$/.test(method) ? method : "GET";
}

export function normalizeRoutePath(raw: unknown): string {
  const path = normalizeGraphLabel(raw, "/");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return normalized.slice(0, MAX_LABEL_LEN);
}

export function normalizeTableName(raw: unknown): string {
  const table = normalizeGraphLabel(raw, "unknown");
  return /^[a-zA-Z0-9_.-]{1,64}$/.test(table) ? table : "unknown";
}
