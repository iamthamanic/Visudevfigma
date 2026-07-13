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

const MAX_STRING_LENGTH = 1000;

function isValidString(value: unknown, maxLength = MAX_STRING_LENGTH): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= maxLength;
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
  if (!isValidString(raw.filePath) || !isValidString(raw.path) || !isValidString(raw.id)) {
    return null;
  }

  const filePath = raw.filePath;
  const path = raw.path.startsWith("/") ? raw.path : `/${raw.path}`;
  return {
    id: raw.id,
    method: isValidString(raw.method) ? raw.method.toUpperCase() : "GET",
    path,
    filePath,
    line: typeof raw.line === "number" && raw.line >= 0 && Number.isFinite(raw.line) ? raw.line : 0,
    pipeline: Array.isArray(raw.pipeline) ? raw.pipeline : [],
    concepts: raw.concepts && typeof raw.concepts === "object" ? raw.concepts : {},
  };
}

export function normalizeFact(raw: RawBlueprintFact): RawBlueprintFact | null {
  if (!raw || typeof raw !== "object") return null;
  if (!isValidString(raw.filePath) || !isValidString(raw.kind) || !isValidString(raw.id)) {
    return null;
  }

  return {
    id: raw.id,
    kind: raw.kind,
    filePath: raw.filePath,
    line: typeof raw.line === "number" && raw.line >= 0 && Number.isFinite(raw.line) ? raw.line : 0,
    snippet: isValidString(raw.snippet, 5000) ? raw.snippet : "",
    metadata: raw.metadata && typeof raw.metadata === "object" ? raw.metadata : {},
  };
}
