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
import type {
  AccessControlFinding,
  AccessControlMatrixCell,
  AccessControlMatrixRow,
  AccessControlStatus,
} from "./access-control-types";
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

const ACCESS_CONTROL_STATUSES = new Set<AccessControlStatus>([
  "protected",
  "partial",
  "unverified",
  "missing",
  "not-applicable",
  "unsupported",
]);

const MAX_ROUTES = 2_000;
const MAX_FINDINGS = 5_000;
const MAX_FACTS = 10_000;
const MAX_MATRIX_ROWS = 2_000;
const MAX_AC_FINDINGS = 5_000;

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

function isAccessControlStatus(value: unknown): value is AccessControlStatus {
  return typeof value === "string" && ACCESS_CONTROL_STATUSES.has(value as AccessControlStatus);
}

function isAccessControlMatrixCell(value: unknown): value is AccessControlMatrixCell {
  if (!isRecord(value)) return false;
  return isAccessControlStatus(value.status);
}

export function isAccessControlMatrixRow(value: unknown): value is AccessControlMatrixRow {
  if (!isRecord(value)) return false;
  const routeId = boundedString(value.routeId);
  const method = boundedString(value.method);
  const path = boundedString(value.path);
  if (!routeId || !method || !path) return false;
  if (
    !isAccessControlMatrixCell(value.authentication) ||
    !isAccessControlMatrixCell(value.authorization) ||
    !isAccessControlMatrixCell(value.resourceScope) ||
    !isAccessControlMatrixCell(value.tenantIsolation) ||
    !isAccessControlMatrixCell(value.ownership) ||
    !isAccessControlMatrixCell(value.validation) ||
    !isAccessControlMatrixCell(value.rateLimit) ||
    !isAccessControlMatrixCell(value.audit) ||
    !isAccessControlStatus(value.overallStatus)
  ) {
    return false;
  }
  return (
    typeof value.findingCount === "number" &&
    Number.isInteger(value.findingCount) &&
    value.findingCount >= 0
  );
}

export function isAccessControlFinding(value: unknown): value is AccessControlFinding {
  if (!isRecord(value)) return false;
  const id = boundedString(value.id);
  const resourceId = boundedString(value.resourceId);
  if (!id || !resourceId || !isAccessControlStatus(value.status)) return false;
  if (typeof value.control !== "string" || value.control.length === 0) return false;
  if (typeof value.resourceKind !== "string" || value.resourceKind.length === 0) return false;
  if (typeof value.confidence !== "number" || !Number.isFinite(value.confidence)) return false;
  if (value.confidence < 0 || value.confidence > 100) return false;
  if (!Array.isArray(value.mechanisms) || !Array.isArray(value.enforcementLayers)) return false;
  if (!Array.isArray(value.evidence)) return false;
  return true;
}

/** Drop malformed AC matrix rows so Diagnostics can fall back to legacy SecurityMatrix. */
export function sanitizeAccessControlMatrix(value: unknown): AccessControlMatrixRow[] {
  return boundedArray(value, MAX_MATRIX_ROWS, isAccessControlMatrixRow);
}

export function sanitizeAccessControlFindings(value: unknown): AccessControlFinding[] {
  return boundedArray(value, MAX_AC_FINDINGS, isAccessControlFinding);
}

export function sanitizeStringList(value: unknown, maxItems = 64): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(0, maxItems)
    .filter((item): item is string => typeof item === "string" && item.length > 0);
}
