/** Validates CodeFact metadata before VisuDevGraph mapping. */

import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import { sanitizeUrlForExport } from "../internal/snippet-sanitizer.ts";
import {
  normalizeGraphLabel,
  normalizeHttpMethod,
  normalizeRoutePath,
  normalizeTableName,
} from "./graph-id.util.ts";

export interface ValidatedRouteMeta {
  method: string;
  path: string;
}

export interface ValidatedTableMeta {
  table: string;
}

export function validateRouteFact(fact: CodeFact): ValidatedRouteMeta | null {
  if (fact.metadata.method == null || fact.metadata.path == null) return null;
  const rawMethod = String(fact.metadata.method).trim();
  const rawPath = String(fact.metadata.path).trim();
  if (!rawMethod || !rawPath) return null;
  return {
    method: normalizeHttpMethod(rawMethod),
    path: normalizeRoutePath(rawPath),
  };
}

export function validateTableFact(fact: CodeFact): ValidatedTableMeta | null {
  if (fact.metadata.table == null) return null;
  const rawTable = String(fact.metadata.table).trim();
  if (!rawTable) return null;
  const table = normalizeTableName(rawTable);
  if (table === "unknown") return null;
  return { table };
}

export function validateExternalFact(fact: CodeFact): string {
  return normalizeGraphLabel(
    sanitizeUrlForExport(fact.metadata.url),
    "External API",
  );
}

export function isMappableFactKind(fact: CodeFact): boolean {
  const mappable = new Set([
    "api-route",
    "db-read",
    "db-write",
    "schema-safe-parse",
    "schema-parse",
    "validation-deny-400",
    "request-body-read",
    "auth-check",
    "auth-deny-401",
    "external-api-call",
    "rate-limit",
  ]);
  return mappable.has(fact.kind);
}

export function validateCodeFactShape(fact: CodeFact): boolean {
  if (!fact || typeof fact !== "object") return false;
  if (typeof fact.id !== "string" || fact.id.trim().length === 0) return false;
  if (typeof fact.kind !== "string" || fact.kind.trim().length === 0) {
    return false;
  }
  if (typeof fact.filePath !== "string" || fact.filePath.trim().length === 0) {
    return false;
  }
  if (!Number.isFinite(fact.line) || fact.line < 1) return false;
  if (typeof fact.snippet !== "string") return false;
  return !(
    !fact.metadata || typeof fact.metadata !== "object" ||
    Array.isArray(fact.metadata)
  );
}

export function validateCodeFactForMapping(fact: CodeFact): boolean {
  if (!validateCodeFactShape(fact)) return false;
  if (!isMappableFactKind(fact)) return false;
  if (fact.kind === "api-route") return validateRouteFact(fact) !== null;
  if (fact.kind === "db-read" || fact.kind === "db-write") {
    return validateTableFact(fact) !== null;
  }
  return true;
}
