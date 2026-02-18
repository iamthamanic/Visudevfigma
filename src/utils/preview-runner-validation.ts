const PROJECT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,127}$/;
const RUN_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,191}$/;
const PROJECT_TOKEN_PATTERN = /^[A-Za-z0-9._~+/=-]{8,512}$/;

function normalizeInput(value: string): string {
  return value.trim();
}

export function sanitizeProjectId(value: string): string | null {
  if (typeof value !== "string") return null;
  const normalized = normalizeInput(value);
  return PROJECT_ID_PATTERN.test(normalized) ? normalized : null;
}

export function sanitizeRunId(value: string): string | null {
  if (typeof value !== "string") return null;
  const normalized = normalizeInput(value);
  return RUN_ID_PATTERN.test(normalized) ? normalized : null;
}

export function sanitizeProjectToken(value: string): string | null {
  if (typeof value !== "string") return null;
  const normalized = normalizeInput(value);
  return PROJECT_TOKEN_PATTERN.test(normalized) ? normalized : null;
}
