/**
 * Typed bridge to shared/project-migration.mjs for Local Engine.
 * Location: local-engine/src/lib/project-migration.ts
 */

import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const sharedModulePath = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../../../shared/project-migration.mjs",
);

export const {
  stripSecretFields,
  supabaseRecordToMetadata,
  localRecordToMetadata,
  metadataToSupabaseCreateBody,
  metadataToLocalCreateInput,
  unwrapSupabaseApiPayload,
} = require(sharedModulePath) as typeof import("../../../shared/project-migration.mjs.d.ts");
