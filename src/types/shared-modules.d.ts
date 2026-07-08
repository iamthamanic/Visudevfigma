declare module "*/shared/local-path-security.mjs" {
  export function resolveValidatedLocalPath(
    rawPath: unknown,
  ): { ok: true; path: string } | { ok: false; error: string };
}
