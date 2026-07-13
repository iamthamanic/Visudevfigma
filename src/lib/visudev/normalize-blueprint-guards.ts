/**
 * Shape guards for Blueprint KV array entries before UI consumption.
 * Location: src/lib/visudev/normalize-blueprint-guards.ts
 */

import type {
  BlueprintFinding,
  CodeFact,
  ConceptState,
  FindingSeverity,
  RouteBlueprint,
  SecurityMatrixCell,
  SecurityMatrixRow,
} from "./blueprint-types";
import { boundedArray, boundedString, isRecord, MAX_STRING_LEN } from "./normalize-graph-guards";

const CONCEPT_STATES = new Set<ConceptState>([
  "confirmed",
  "partial",
  "weak",
  "missing",
  "unknown",
  "contradictory",
]);

const FINDING_SEVERITIES = new Set<FindingSeverity>(["info", "low", "medium", "high", "critical"]);

const MAX_ROUTES = 2_000;
const MAX_FINDINGS = 5_000;
const MAX_FACTS = 10_000;
const MAX_MATRIX_ROWS = 2_000;

function isConceptState(value: unknown): value is ConceptState {
  return typeof value === "string" && CONCEPT_STATES.has(value as ConceptState);
}

function isFindingSeverity(value: unknown): value is FindingSeverity {
  return typeof value === "string" && FINDING_SEVERITIES.has(value as FindingSeverity);
}

function positiveLine(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

function isSecurityMatrixCell(value: unknown): value is SecurityMatrixCell {
  if (!isRecord(value)) return false;
  const state = value.state;
  return state === "n/a" || isConceptState(state);
}

export function isRouteBlueprint(value: unknown): value is RouteBlueprint {
  if (!isRecord(value)) return false;
  const id = boundedString(value.id);
  const method = boundedString(value.method);
  const path = boundedString(value.path);
  const filePath = boundedString(value.filePath);
  if (!id || !method || !path || !filePath || !positiveLine(value.line)) return false;
  if (!Array.isArray(value.pipeline)) return false;
  if (!isRecord(value.concepts)) return false;
  for (const concept of Object.values(value.concepts)) {
    if (!isConceptState(concept)) return false;
  }
  return true;
}

export function isSecurityMatrixRow(value: unknown): value is SecurityMatrixRow {
  if (!isRecord(value)) return false;
  const routeId = boundedString(value.routeId);
  const method = boundedString(value.method);
  const path = boundedString(value.path);
  if (!routeId || !method || !path) return false;
  if (
    !isSecurityMatrixCell(value.auth) ||
    !isSecurityMatrixCell(value.role) ||
    !isSecurityMatrixCell(value.validation) ||
    !isSecurityMatrixCell(value.rateLimit) ||
    !isSecurityMatrixCell(value.db) ||
    !isSecurityMatrixCell(value.rls) ||
    !isSecurityMatrixCell(value.audit)
  ) {
    return false;
  }
  return (
    typeof value.findingCount === "number" &&
    Number.isInteger(value.findingCount) &&
    value.findingCount >= 0
  );
}

export function isBlueprintFinding(value: unknown): value is BlueprintFinding {
  if (!isRecord(value)) return false;
  const id = boundedString(value.id);
  const ruleId = boundedString(value.ruleId);
  const category = boundedString(value.category);
  const scopeId = boundedString(value.scopeId);
  const message = boundedString(value.message, MAX_STRING_LEN * 2);
  const expectedState = boundedString(value.expectedState);
  const actualState = boundedString(value.actualState);
  if (
    !id ||
    !ruleId ||
    !category ||
    !scopeId ||
    !message ||
    !expectedState ||
    !actualState ||
    !isFindingSeverity(value.severity)
  ) {
    return false;
  }
  if (typeof value.confidence !== "number" || !Number.isFinite(value.confidence)) return false;
  if (!Array.isArray(value.evidenceFactIds)) return false;
  return value.evidenceFactIds.every((factId) => typeof factId === "string" && factId.length > 0);
}

export function isCodeFact(value: unknown): value is CodeFact {
  if (!isRecord(value)) return false;
  const id = boundedString(value.id);
  const kind = boundedString(value.kind);
  const filePath = boundedString(value.filePath);
  const snippet = boundedString(value.snippet, MAX_STRING_LEN * 4);
  if (!id || !kind || !filePath || snippet === undefined || !positiveLine(value.line)) {
    return false;
  }
  return isRecord(value.metadata);
}

export function sanitizeRoutes(value: unknown): RouteBlueprint[] {
  return boundedArray(value, MAX_ROUTES, isRouteBlueprint);
}

export function sanitizeSecurityMatrix(value: unknown): SecurityMatrixRow[] {
  return boundedArray(value, MAX_MATRIX_ROWS, isSecurityMatrixRow);
}

export function sanitizeFindings(value: unknown): BlueprintFinding[] {
  return boundedArray(value, MAX_FINDINGS, isBlueprintFinding);
}

export function sanitizeFacts(value: unknown): CodeFact[] {
  return boundedArray(value, MAX_FACTS, isCodeFact);
}

export function sanitizeStringList(value: unknown, maxItems = 64): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, maxItems)
    .filter((item): item is string => typeof item === "string" && item.length > 0);
}
