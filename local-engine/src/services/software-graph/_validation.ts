/**
 * Runtime validation helpers for RawBlueprintScan.
 */

import type {
  RawBlueprintFact,
  RawBlueprintRoute,
  RawBlueprintScan,
} from "../../types/api.types.js";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function validateScan(scan: RawBlueprintScan): string | null {
  if (!isNonEmptyString(scan.projectId)) return "scan.projectId is required";
  if (!isNonEmptyString(scan.analyzedAt)) return "scan.analyzedAt is required";
  if (!Array.isArray(scan.routes)) return "scan.routes must be an array";
  if (!Array.isArray(scan.facts)) return "scan.facts must be an array";
  if (typeof scan.filesAnalyzed !== "number" || scan.filesAnalyzed < 0) {
    return "scan.filesAnalyzed must be a non-negative number";
  }
  return null;
}

export function normalizeRoute(raw: RawBlueprintRoute): RawBlueprintRoute | null {
  if (!raw || typeof raw !== "object") return null;
  const filePath = isNonEmptyString(raw.filePath) ? raw.filePath : "unknown";
  const path = isNonEmptyString(raw.path)
    ? raw.path.startsWith("/")
      ? raw.path
      : `/${raw.path}`
    : "/";
  const id = isNonEmptyString(raw.id) ? raw.id : `route:${filePath}:${path}`;
  return {
    id,
    method: isNonEmptyString(raw.method) ? raw.method.toUpperCase() : "GET",
    path,
    filePath,
    line: typeof raw.line === "number" && raw.line >= 0 ? raw.line : 0,
    pipeline: Array.isArray(raw.pipeline) ? raw.pipeline : [],
    concepts: raw.concepts && typeof raw.concepts === "object" ? raw.concepts : {},
  };
}

export function normalizeFact(raw: RawBlueprintFact): RawBlueprintFact | null {
  if (!raw || typeof raw !== "object") return null;
  const filePath = isNonEmptyString(raw.filePath) ? raw.filePath : "unknown";
  const id = isNonEmptyString(raw.id)
    ? raw.id
    : `fact:${filePath}:${Math.random().toString(36).slice(2)}`;
  return {
    id,
    kind: isNonEmptyString(raw.kind) ? raw.kind : "unknown",
    filePath,
    line: typeof raw.line === "number" && raw.line >= 0 ? raw.line : 0,
    snippet: isNonEmptyString(raw.snippet) ? raw.snippet : "",
    metadata: raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {},
  };
}
