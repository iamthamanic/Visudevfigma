/**
 * Typed bridge to shared local-path-security.mjs for Local Engine.
 * Location: local-engine/src/lib/local-path-security.ts
 */

import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export type LocalPathValidationResult = { ok: true; path: string } | { ok: false; error: string };

const require = createRequire(import.meta.url);
const sharedModulePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../shared/local-path-security.mjs",
);

const shared = require(sharedModulePath) as {
  resolveValidatedLocalPath: (rawPath: unknown) => LocalPathValidationResult;
};

export function resolveValidatedLocalPath(rawPath: unknown): LocalPathValidationResult {
  return shared.resolveValidatedLocalPath(rawPath);
}
