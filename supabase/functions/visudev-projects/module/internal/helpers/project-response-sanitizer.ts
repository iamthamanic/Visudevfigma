/**
 * Redact sensitive project fields before API responses.
 * Location: visudev-projects/module/internal/helpers/project-response-sanitizer.ts
 */

const SENSITIVE_KEYS = [
  "github_access_token",
  "supabase_anon_key",
  "supabase_management_token",
] as const;

export function sanitizeProjectResponse<T extends Record<string, unknown>>(
  project: T,
): T {
  const redacted = { ...project };
  for (const key of SENSITIVE_KEYS) {
    if (key in redacted) {
      delete redacted[key];
    }
  }
  return redacted;
}

export function sanitizeProjectList<T extends Record<string, unknown>>(
  projects: T[],
): T[] {
  return projects.map((project) => sanitizeProjectResponse(project));
}
