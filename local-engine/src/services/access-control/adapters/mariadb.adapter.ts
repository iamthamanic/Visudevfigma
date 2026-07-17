/**
 * MariaDB / MySQL security adapter — grants, SQL SECURITY views, procedures,
 * and repository tenant_id filters. Never requires PostgreSQL-style RLS.
 */

import type {
  AccessControlEvidence,
  AccessControlFinding,
  AccessControlMechanismDetail,
  AccessControlStatus,
  DatabaseSecurityAdapter,
  DatabaseSecurityAdapterInput,
} from "../types.js";

export const MARIADB_SECURITY_VIEW_LABEL = "MariaDB SECURITY VIEW";
export const MARIADB_GRANT_LABEL = "MariaDB Grant";
export const MARIADB_PROCEDURE_LABEL = "MariaDB Stored Procedure";
export const MARIADB_REPO_FILTER_LABEL = "Repository Query Filter";

const SECURITY_VIEW_RE =
  /\bCREATE\s+(?:OR\s+REPLACE\s+)?(?:SQL\s+SECURITY\s+\w+\s+)?VIEW\b|\bSQL\s+SECURITY\s+(?:DEFINER|INVOKER)\b/i;
const GRANT_RE = /\bGRANT\s+\w+/i;
const PROCEDURE_RE = /\bCREATE\s+(?:DEFINER\s*=\s*\S+\s+)?(?:PROCEDURE|FUNCTION)\b/i;
const TENANT_FILTER_RE = /\b(?:tenant_id|org_id|organization_id)\b\s*(?::|=|IN\s*\(|\.equals\()/i;

export interface MariadbSignals {
  hasSecurityView: boolean;
  hasGrant: boolean;
  hasProcedure: boolean;
  hasRepoTenantFilter: boolean;
  matchedFacts: DatabaseSecurityAdapterInput["facts"];
}

export function detectMariadbSignals(facts: DatabaseSecurityAdapterInput["facts"]): MariadbSignals {
  const matchedFacts: DatabaseSecurityAdapterInput["facts"] = [];
  let hasSecurityView = false;
  let hasGrant = false;
  let hasProcedure = false;
  let hasRepoTenantFilter = false;

  for (const fact of facts) {
    const blob = `${fact.kind}\n${fact.snippet}\n${fact.filePath}`;
    let matched = false;
    if (SECURITY_VIEW_RE.test(blob)) {
      hasSecurityView = true;
      matched = true;
    }
    if (GRANT_RE.test(blob)) {
      hasGrant = true;
      matched = true;
    }
    if (PROCEDURE_RE.test(blob)) {
      hasProcedure = true;
      matched = true;
    }
    if (TENANT_FILTER_RE.test(blob)) {
      hasRepoTenantFilter = true;
      matched = true;
    }
    if (matched) matchedFacts.push(fact);
  }

  return { hasSecurityView, hasGrant, hasProcedure, hasRepoTenantFilter, matchedFacts };
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

function mechanisms(signals: MariadbSignals): AccessControlMechanismDetail[] {
  const list: AccessControlMechanismDetail[] = [];
  if (signals.hasSecurityView) {
    list.push({
      kind: "security-view",
      label: MARIADB_SECURITY_VIEW_LABEL,
      technology: "mariadb",
    });
  }
  if (signals.hasGrant) {
    list.push({
      kind: "database-grant",
      label: MARIADB_GRANT_LABEL,
      technology: "mariadb",
    });
  }
  if (signals.hasProcedure) {
    list.push({
      kind: "stored-procedure",
      label: MARIADB_PROCEDURE_LABEL,
      technology: "mariadb",
    });
  }
  if (signals.hasRepoTenantFilter) {
    list.push({
      kind: "repository-filter",
      label: MARIADB_REPO_FILTER_LABEL,
      technology: "application",
    });
  }
  return list;
}

function statusFromSignals(signals: MariadbSignals): AccessControlStatus {
  const dbNative = signals.hasSecurityView || signals.hasGrant || signals.hasProcedure;
  if (dbNative && signals.hasRepoTenantFilter) return "protected";
  if (dbNative || signals.hasRepoTenantFilter) return "partial";
  if (signals.matchedFacts.length === 0) return "unverified";
  return "missing";
}

function buildFindings(resourceId: string, signals: MariadbSignals): AccessControlFinding[] {
  const mech = mechanisms(signals);
  const evidence = toEvidence(signals.matchedFacts);
  const status = statusFromSignals(signals);
  const layers: AccessControlFinding["enforcementLayers"] = [];
  if (signals.hasSecurityView || signals.hasGrant || signals.hasProcedure) {
    layers.push("database");
  }
  if (signals.hasRepoTenantFilter) layers.push("repository");
  if (layers.length === 0) layers.push("database");

  return [
    {
      id: `ac-maria-tenant-${resourceId}`,
      resourceId,
      resourceKind: "route",
      control: "tenant-isolation",
      status,
      mechanisms: mech,
      enforcementLayers: layers,
      evidence,
      confidence: status === "protected" ? 85 : 55,
      warning:
        status === "missing"
          ? "MariaDB/MySQL: no SECURITY VIEW, grants, procedures, or tenant_id repo filter evidenced."
          : status === "partial" && !signals.hasRepoTenantFilter
            ? "DB mechanism present without repository tenant filter — dual enforcement recommended."
            : status === "partial" && !signals.hasSecurityView
              ? "Repository tenant filter without DB-native view/grant — dual mechanism preferred."
              : undefined,
      ruleId: "access-control.mariadb-tenant",
    },
    {
      id: `ac-maria-scope-${resourceId}`,
      resourceId,
      resourceKind: "route",
      control: "resource-scope",
      status,
      mechanisms: mech,
      enforcementLayers: layers,
      evidence,
      confidence: status === "protected" ? 85 : 55,
      ruleId: "access-control.mariadb-scope",
    },
  ];
}

function createMariadbAdapter(dialect: "mariadb" | "mysql"): DatabaseSecurityAdapter {
  return {
    dialect,
    analyze(input: DatabaseSecurityAdapterInput): AccessControlFinding[] {
      if (input.dialect !== "mariadb" && input.dialect !== "mysql") return [];
      const signals = detectMariadbSignals(input.facts);
      const resourceIds = input.resourceIds?.length ? input.resourceIds : ["*"];
      return resourceIds.flatMap((id) => buildFindings(id, signals));
    },
  };
}

export const mariadbDatabaseSecurityAdapter = createMariadbAdapter("mariadb");
export const mysqlDatabaseSecurityAdapter = createMariadbAdapter("mysql");

/** Inspector helper: prefer dual labels when both view + repo filter exist. */
export function mariadbInspectorMechanismLabels(findings: AccessControlFinding[]): string[] {
  const labels = new Set<string>();
  for (const finding of findings) {
    for (const m of finding.mechanisms ?? []) {
      if (m.label === MARIADB_SECURITY_VIEW_LABEL || m.label === MARIADB_REPO_FILTER_LABEL) {
        labels.add(m.label);
      }
    }
  }
  return [...labels];
}
