/**
 * Stack-agnostic access control types for Diagnostics v3+.
 */

export type AccessControlStatus = "pass" | "warn" | "fail" | "unknown";

export type DatabaseSecurityDialect = "postgresql" | "mysql" | "mongodb" | "unknown";

export type AccessControlMechanism = "authn" | "authz" | "scope" | "tenant" | "ownership";

export interface AccessControlFinding {
  id: string;
  routeId: string;
  mechanism: AccessControlMechanism;
  status: AccessControlStatus;
  message: string;
  evidence?: string;
}

export interface AccessControlMatrixRow {
  routeId: string;
  method: string;
  path: string;
  authn: AccessControlStatus;
  authz: AccessControlStatus;
  scope: AccessControlStatus;
  tenant: AccessControlStatus;
  ownership: AccessControlStatus;
  status: AccessControlStatus;
}
