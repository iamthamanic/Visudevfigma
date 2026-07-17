/**
 * Stack-agnostic access control domain model for Blueprint Diagnostics.
 * Mechanisms are technology-specific; controls and status are universal.
 */

/** How access is constrained — detected by technology-specific adapters. */
export type AccessControlMechanism =
  | "database-row-policy"
  | "database-role"
  | "database-grant"
  | "security-view"
  | "stored-procedure"
  | "collection-permission"
  | "security-rule"
  | "application-guard"
  | "service-authorization"
  | "repository-filter"
  | "query-scope"
  | "ownership-check"
  | "tenant-filter"
  | "input-validation"
  | "rate-limit"
  | "audit-log";

/** What security property is being assessed. */
export type AccessControlControl =
  | "authentication"
  | "authorization"
  | "resource-scope"
  | "tenant-isolation"
  | "ownership"
  | "read-restriction"
  | "write-restriction"
  | "validation"
  | "rate-limit"
  | "privileged-access"
  | "audit"
  | "encryption";

/** Outcome of assessing one control for one resource. */
export type AccessControlStatus =
  | "protected"
  | "partial"
  | "unverified"
  | "missing"
  | "not-applicable"
  | "unsupported";

/** Where a control is enforced in the request/data path. */
export type EnforcementLayer =
  | "client"
  | "api"
  | "service"
  | "repository"
  | "database"
  | "infrastructure";

/** Human-readable mechanism label for inspector (may name the technology). */
export interface AccessControlMechanismDetail {
  kind: AccessControlMechanism;
  /** e.g. "PostgreSQL RLS", "Repository Query Filter" */
  label: string;
  /** Optional technology hint for grouping in UI. */
  technology?: string;
}

export interface AccessControlEvidence {
  id: string;
  kind: string;
  filePath: string;
  line: number;
  excerpt: string;
  factId?: string;
}

/** One control assessment for a route, table, collection, or other resource. */
export interface AccessControlFinding {
  id: string;
  resourceId: string;
  /** Route id, table id, or graph node id. */
  resourceKind: "route" | "table" | "collection" | "document" | "service" | "other";
  control: AccessControlControl;
  status: AccessControlStatus;
  mechanisms: AccessControlMechanismDetail[];
  enforcementLayers: EnforcementLayer[];
  evidence: AccessControlEvidence[];
  confidence: number;
  /** Optional warning when an alternate access path bypasses the control. */
  warning?: string;
  /** Policy rule id when emitted by expectation engine. */
  ruleId?: string;
}

/** Database dialect hint for adapter selection. */
export type DatabaseSecurityDialect =
  | "postgres"
  | "supabase"
  | "mariadb"
  | "mysql"
  | "mongodb"
  | "sqlite"
  | "firestore"
  | "dynamodb"
  | "unknown";

/** Per-route summary for Diagnostics matrix (replaces legacy RLS column). */
export interface AccessControlMatrixCell {
  status: AccessControlStatus;
  /** Primary mechanism label for compact display; full list in inspector. */
  mechanismLabel?: string;
}

export interface AccessControlMatrixRow {
  routeId: string;
  method: string;
  path: string;
  authentication: AccessControlMatrixCell;
  authorization: AccessControlMatrixCell;
  resourceScope: AccessControlMatrixCell;
  tenantIsolation: AccessControlMatrixCell;
  ownership: AccessControlMatrixCell;
  validation: AccessControlMatrixCell;
  rateLimit: AccessControlMatrixCell;
  audit: AccessControlMatrixCell;
  /** Worst status across controls for badge column. */
  overallStatus: AccessControlStatus;
  findingCount: number;
}

/** Map legacy concept states to access control status where needed. */
export type LegacyConceptState =
  | "confirmed"
  | "partial"
  | "weak"
  | "missing"
  | "unknown"
  | "contradictory"
  | "n/a";
