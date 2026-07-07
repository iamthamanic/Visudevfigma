export type LocalPathValidationResult = { ok: true; path: string } | { ok: false; error: string };

export function resolveValidatedLocalPath(rawPath: unknown): LocalPathValidationResult;
