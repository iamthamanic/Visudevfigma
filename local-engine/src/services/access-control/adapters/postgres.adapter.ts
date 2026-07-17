/**
 * PostgreSQL / Supabase security adapter — detects RLS, policies, and grants
 * from SQL/fact snippets without a live database connection.
 */

import type {
  DatabaseSecurityAdapter,
  DatabaseSecurityAdapterInput,
} from "../../../../../shared/access-control-adapter.js";
import type {
  AccessControlEvidence,
  AccessControlFinding,
  AccessControlMechanismDetail,
  AccessControlStatus,
  DatabaseSecurityDialect,
} from "../../../../../shared/access-control.types.js";

export const POSTGRES_RLS_LABEL = "PostgreSQL RLS";
export const POSTGRES_GRANT_LABEL = "PostgreSQL Grant";
export const POSTGRES_ROLE_LABEL = "PostgreSQL Role";

const RLS_ENABLE_RE = /\bENABLE\s+ROW\s+LEVEL\s+SECURITY\b/i;
const RLS_FORCE_RE = /\bFORCE\s+ROW\s+LEVEL\s+SECURITY\b/i;
const CREATE_POLICY_RE = /\bCREATE\s+POLICY\b/i;
const GRANT_RE = /\bGRANT\s+\w+/i;
const CREATE_ROLE_RE = /\bCREATE\s+ROLE\b/i;
const ALTER_TABLE_POLICY_RE =
  /\bALTER\s+TABLE\b[\s\S]{0,120}\b(?:ENABLE|FORCE)\s+ROW\s+LEVEL\s+SECURITY\b/i;

export interface PostgresSqlSignals {
  hasRlsEnable: boolean;
  hasPolicy: boolean;
  hasGrant: boolean;
  hasRole: boolean;
  matchedFacts: DatabaseSecurityAdapterInput["facts"];
}

export function detectPostgresSqlSignals(
  facts: DatabaseSecurityAdapterInput["facts"],
): PostgresSqlSignals {
  const matchedFacts: DatabaseSecurityAdapterInput["facts"] = [];
  let hasRlsEnable = false;
  let hasPolicy = false;
  let hasGrant = false;
  let hasRole = false;

  for (const fact of facts) {
    const blob = `${fact.kind}\n${fact.snippet}\n${fact.filePath}`;
    let matched = false;
    if (RLS_ENABLE_RE.test(blob) || RLS_FORCE_RE.test(blob) || ALTER_TABLE_POLICY_RE.test(blob)) {
      hasRlsEnable = true;
      matched = true;
    }
    if (CREATE_POLICY_RE.test(blob)) {
      hasPolicy = true;
      matched = true;
    }
    if (GRANT_RE.test(blob)) {
      hasGrant = true;
      matched = true;
    }
    if (CREATE_ROLE_RE.test(blob)) {
      hasRole = true;
      matched = true;
    }
    if (matched) matchedFacts.push(fact);
  }

  return { hasRlsEnable, hasPolicy, hasGrant, hasRole, matchedFacts };
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

function rlsMechanisms(signals: PostgresSqlSignals): AccessControlMechanismDetail[] {
  const mechanisms: AccessControlMechanismDetail[] = [];
  if (signals.hasRlsEnable || signals.hasPolicy) {
    mechanisms.push({
      kind: "database-row-policy",
      label: POSTGRES_RLS_LABEL,
      technology: "postgresql",
    });
  }
  if (signals.hasGrant) {
    mechanisms.push({
      kind: "database-grant",
      label: POSTGRES_GRANT_LABEL,
      technology: "postgresql",
    });
  }
  if (signals.hasRole) {
    mechanisms.push({
      kind: "database-role",
      label: POSTGRES_ROLE_LABEL,
      technology: "postgresql",
    });
  }
  return mechanisms;
}

function statusFromSignals(signals: PostgresSqlSignals): AccessControlStatus {
  if (signals.hasRlsEnable && signals.hasPolicy) return "protected";
  if (signals.hasRlsEnable || signals.hasPolicy) return "partial";
  if (signals.hasGrant || signals.hasRole) return "partial";
  if (signals.matchedFacts.length === 0) return "unverified";
  return "missing";
}

function buildFindingsForResource(
  resourceId: string,
  signals: PostgresSqlSignals,
  dialect: DatabaseSecurityDialect,
): AccessControlFinding[] {
  const mechanisms = rlsMechanisms(signals);
  const evidence = toEvidence(signals.matchedFacts);
  const status = statusFromSignals(signals);
  const labelHint = dialect === "supabase" ? "Supabase/PostgreSQL" : "PostgreSQL";

  return [
    {
      id: `ac-pg-tenant-${resourceId}`,
      resourceId,
      resourceKind: "route",
      control: "tenant-isolation",
      status,
      mechanisms,
      enforcementLayers: ["database"],
      evidence,
      confidence: status === "protected" ? 0.85 : 0.6,
      warning:
        status === "missing"
          ? `${labelHint}: no RLS enable/policy evidenced in SQL facts.`
          : status === "partial"
            ? `${labelHint}: incomplete RLS (enable and policy not both evidenced).`
            : undefined,
      ruleId: "access-control.postgres-rls",
    },
    {
      id: `ac-pg-scope-${resourceId}`,
      resourceId,
      resourceKind: "route",
      control: "resource-scope",
      status,
      mechanisms,
      enforcementLayers: ["database"],
      evidence,
      confidence: status === "protected" ? 0.85 : 0.6,
      ruleId: "access-control.postgres-rls",
    },
  ];
}

function createPostgresAdapter(dialect: "postgres" | "supabase"): DatabaseSecurityAdapter {
  return {
    dialect,
    analyze(input: DatabaseSecurityAdapterInput): AccessControlFinding[] {
      if (input.dialect !== "postgres" && input.dialect !== "supabase") {
        return [];
      }
      const signals = detectPostgresSqlSignals(input.facts);
      const resourceIds = input.resourceIds?.length ? input.resourceIds : ["*"];
      return resourceIds.flatMap((id) => buildFindingsForResource(id, signals, dialect));
    },
  };
}

export const postgresDatabaseSecurityAdapter = createPostgresAdapter("postgres");
export const supabaseDatabaseSecurityAdapter = createPostgresAdapter("supabase");

/** Inspector / UI: primary mechanism label when RLS evidence exists. */
export function postgresInspectorMechanismLabel(
  findings: AccessControlFinding[],
): string | undefined {
  for (const finding of findings) {
    const match = finding.mechanisms.find((m) => m.label === POSTGRES_RLS_LABEL);
    if (match) return match.label;
  }
  return undefined;
}
