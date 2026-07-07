/**
 * Server-side local_path validation (format + jail prefixes; no host FS access in edge).
 * Location: visudev-projects/module/validators/local-path.validator.ts
 */

import { z } from "zod";

const MAX_LOCAL_PATH_LEN = 4096;

function allowedRootPrefixes(): string[] {
  const raw = Deno.env.get("VISUDEV_ALLOWED_LOCAL_ROOTS")?.trim();
  if (!raw) return ["/Users/", "/home/"];
  return raw
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((entry) => (entry.endsWith("/") ? entry : `${entry}/`));
}

export const localPathSchema = z
  .string()
  .trim()
  .min(1, "local_path is required")
  .max(MAX_LOCAL_PATH_LEN, "local_path is too long")
  .refine(
    (value) => value.startsWith("/"),
    "local_path must be an absolute path",
  )
  .refine((value) => !value.includes("\0"), "local_path is invalid")
  .refine((value) => {
    const segments = value.split("/").filter((segment) => segment.length > 0);
    return !segments.includes("..");
  }, "local_path must not contain '..'")
  .refine((value) => !value.includes("//"), "local_path must be normalized")
  .refine((value) => {
    const prefixes = allowedRootPrefixes();
    return prefixes.some((prefix) =>
      value === prefix.slice(0, -1) || value.startsWith(prefix)
    );
  }, "local_path is outside allowed roots");
