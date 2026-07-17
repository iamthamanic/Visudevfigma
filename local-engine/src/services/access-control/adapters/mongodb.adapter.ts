/**
 * MongoDB security adapter — collection roles, tenantId/ownerId filters, middleware.
 * Schema validation maps to the validation control only (not tenant isolation).
 */

import type {
  AccessControlEvidence,
  AccessControlFinding,
  AccessControlMechanismDetail,
  AccessControlStatus,
  DatabaseSecurityAdapter,
  DatabaseSecurityAdapterInput,
} from "../types.js";

export const MONGO_COLLECTION_ROLE_LABEL = "MongoDB Collection Role";
export const MONGO_TENANT_FILTER_LABEL = "MongoDB tenantId Filter";
export const MONGO_OWNER_FILTER_LABEL = "MongoDB ownerId Filter";
export const MONGO_MIDDLEWARE_LABEL = "MongoDB Auth Middleware";
export const MONGO_SCHEMA_VALIDATION_LABEL = "MongoDB Schema Validation";

const COLLECTION_ROLE_RE =
  /\b(?:createRole|grantRolesToUser|roles\s*:\s*\[|db\.grantRolesToUser)\b/i;
const TENANT_FILTER_RE = /\btenantId\b\s*(?::|=)/;
const OWNER_FILTER_RE = /\bownerId\b\s*(?::|=)/;
const MIDDLEWARE_RE = /\b(?:authMiddleware|requireAuth|passport\.authenticate|acl\.|casl\.)\b/i;
const SCHEMA_VALIDATION_RE =
  /(?:\$jsonSchema|\bvalidator\s*:\s*\{|\bmongoose\.Schema\b|\bzod\.|\bjoi\.)/i;
const UNSCOPED_FIND_RE = /\.find\s*\(\s*\{\s*\}\s*\)/;

export interface MongodbSignals {
  hasCollectionRole: boolean;
  hasTenantFilter: boolean;
  hasOwnerFilter: boolean;
  hasMiddleware: boolean;
  hasSchemaValidation: boolean;
  hasUnscopedFind: boolean;
  matchedFacts: DatabaseSecurityAdapterInput["facts"];
  unscopedFacts: DatabaseSecurityAdapterInput["facts"];
}

function isFactRecord(value: unknown): value is DatabaseSecurityAdapterInput["facts"][number] {
  if (!value || typeof value !== "object") return false;
  const fact = value as Record<string, unknown>;
  return (
    typeof fact.id === "string" &&
    fact.id.length > 0 &&
    fact.id.length <= 256 &&
    typeof fact.kind === "string" &&
    typeof fact.filePath === "string" &&
    typeof fact.snippet === "string" &&
    typeof fact.line === "number" &&
    Number.isFinite(fact.line)
  );
}

function sanitizeFacts(
  facts: DatabaseSecurityAdapterInput["facts"] | undefined,
): DatabaseSecurityAdapterInput["facts"] {
  if (!Array.isArray(facts)) return [];
  return facts.filter(isFactRecord).slice(0, 500);
}

function sanitizeResourceIds(ids: string[] | undefined): string[] {
  if (!Array.isArray(ids) || ids.length === 0) return ["*"];
  return ids
    .filter((id): id is string => typeof id === "string" && id.length > 0 && id.length <= 256)
    .slice(0, 200);
}

export function detectMongodbSignals(facts: DatabaseSecurityAdapterInput["facts"]): MongodbSignals {
  const matchedFacts: DatabaseSecurityAdapterInput["facts"] = [];
  const unscopedFacts: DatabaseSecurityAdapterInput["facts"] = [];
  let hasCollectionRole = false;
  let hasTenantFilter = false;
  let hasOwnerFilter = false;
  let hasMiddleware = false;
  let hasSchemaValidation = false;
  let hasUnscopedFind = false;

  for (const fact of facts) {
    const blob = `${fact.kind}\n${fact.snippet}\n${fact.filePath}`;
    let matched = false;
    if (COLLECTION_ROLE_RE.test(blob)) {
      hasCollectionRole = true;
      matched = true;
    }
    if (TENANT_FILTER_RE.test(blob)) {
      hasTenantFilter = true;
      matched = true;
    }
    if (OWNER_FILTER_RE.test(blob)) {
      hasOwnerFilter = true;
      matched = true;
    }
    if (MIDDLEWARE_RE.test(blob)) {
      hasMiddleware = true;
      matched = true;
    }
    if (SCHEMA_VALIDATION_RE.test(blob)) {
      hasSchemaValidation = true;
      matched = true;
    }
    if (UNSCOPED_FIND_RE.test(fact.snippet)) {
      hasUnscopedFind = true;
      unscopedFacts.push(fact);
      matched = true;
    }
    if (matched) matchedFacts.push(fact);
  }

  return {
    hasCollectionRole,
    hasTenantFilter,
    hasOwnerFilter,
    hasMiddleware,
    hasSchemaValidation,
    hasUnscopedFind,
    matchedFacts,
    unscopedFacts,
  };
}

function toEvidence(facts: DatabaseSecurityAdapterInput["facts"]): AccessControlEvidence[] {
  return facts.slice(0, 8).map((f) => ({
    id: `ev-${f.id}`,
    kind: f.kind,
    filePath: f.filePath,
    line: f.line,
    excerpt: f.snippet.slice(0, 240),
    factId: f.id,
  }));
}

function isolationMechanisms(signals: MongodbSignals): AccessControlMechanismDetail[] {
  const list: AccessControlMechanismDetail[] = [];
  if (signals.hasCollectionRole) {
    list.push({
      kind: "collection-permission",
      label: MONGO_COLLECTION_ROLE_LABEL,
      technology: "mongodb",
    });
  }
  if (signals.hasTenantFilter) {
    list.push({
      kind: "tenant-filter",
      label: MONGO_TENANT_FILTER_LABEL,
      technology: "mongodb",
    });
  }
  if (signals.hasOwnerFilter) {
    list.push({
      kind: "ownership-check",
      label: MONGO_OWNER_FILTER_LABEL,
      technology: "mongodb",
    });
  }
  if (signals.hasMiddleware) {
    list.push({
      kind: "application-guard",
      label: MONGO_MIDDLEWARE_LABEL,
      technology: "application",
    });
  }
  return list;
}

function isolationStatus(signals: MongodbSignals): AccessControlStatus {
  if (signals.hasUnscopedFind && !signals.hasTenantFilter && !signals.hasOwnerFilter) {
    return "partial";
  }
  if (
    (signals.hasTenantFilter || signals.hasOwnerFilter) &&
    (signals.hasCollectionRole || signals.hasMiddleware)
  ) {
    return "protected";
  }
  if (signals.hasTenantFilter || signals.hasOwnerFilter || signals.hasCollectionRole) {
    return "partial";
  }
  if (signals.hasMiddleware) return "partial";
  if (signals.matchedFacts.length === 0 && !signals.hasSchemaValidation) return "unverified";
  if (signals.hasSchemaValidation && !signals.hasTenantFilter && !signals.hasOwnerFilter) {
    return "unverified";
  }
  return "missing";
}

function factsForResource(
  facts: DatabaseSecurityAdapterInput["facts"],
  resourceId: string,
): DatabaseSecurityAdapterInput["facts"] {
  if (resourceId === "*") return facts;
  const needle = resourceId.toLowerCase();
  return facts.filter((f) => {
    const blob = `${f.id}\n${f.filePath}\n${f.snippet}`.toLowerCase();
    return blob.includes(needle);
  });
}

function buildFindings(resourceId: string, signals: MongodbSignals): AccessControlFinding[] {
  const safeId = resourceId.replace(/[^a-zA-Z0-9._:/-]/g, "_").slice(0, 128);
  const mech = isolationMechanisms(signals);
  const status = isolationStatus(signals);
  const evidence = toEvidence(
    signals.hasUnscopedFind ? signals.unscopedFacts : signals.matchedFacts,
  );
  const findings: AccessControlFinding[] = [
    {
      id: `ac-mongo-tenant-${safeId}`,
      resourceId,
      resourceKind: "route",
      control: "tenant-isolation",
      status,
      mechanisms: mech,
      enforcementLayers: ["repository", "database"],
      evidence,
      confidence: status === "protected" ? 85 : 55,
      warning: signals.hasUnscopedFind
        ? "Unscoped find({}) observed — queries may return documents across tenants."
        : undefined,
      ruleId: "access-control.mongodb-tenant",
    },
    {
      id: `ac-mongo-ownership-${safeId}`,
      resourceId,
      resourceKind: "route",
      control: "ownership",
      status: signals.hasOwnerFilter
        ? signals.hasMiddleware
          ? "protected"
          : "partial"
        : status === "unverified"
          ? "unverified"
          : "missing",
      mechanisms: mech.filter(
        (m) => m.kind === "ownership-check" || m.kind === "application-guard",
      ),
      enforcementLayers: ["repository"],
      evidence,
      confidence: 55,
      ruleId: "access-control.mongodb-ownership",
    },
  ];

  if (signals.hasSchemaValidation) {
    findings.push({
      id: `ac-mongo-validation-${safeId}`,
      resourceId,
      resourceKind: "route",
      control: "validation",
      status: "protected",
      mechanisms: [
        {
          kind: "input-validation",
          label: MONGO_SCHEMA_VALIDATION_LABEL,
          technology: "mongodb",
        },
      ],
      enforcementLayers: ["database"],
      evidence: toEvidence(
        signals.matchedFacts.filter((f) => SCHEMA_VALIDATION_RE.test(f.snippet)),
      ),
      confidence: 70,
      ruleId: "access-control.mongodb-validation",
    });
  }

  return findings;
}

export const mongodbDatabaseSecurityAdapter: DatabaseSecurityAdapter = {
  dialect: "mongodb",
  analyze(input: DatabaseSecurityAdapterInput): AccessControlFinding[] {
    if (input.dialect !== "mongodb") return [];
    const facts = sanitizeFacts(input.facts);
    const resourceIds = sanitizeResourceIds(input.resourceIds);
    return resourceIds.flatMap((id) => {
      const scoped = factsForResource(facts, id);
      // Fall back to all facts only for wildcard resource
      const signals = detectMongodbSignals(scoped.length > 0 || id === "*" ? scoped : []);
      return buildFindings(id, signals);
    });
  },
};
