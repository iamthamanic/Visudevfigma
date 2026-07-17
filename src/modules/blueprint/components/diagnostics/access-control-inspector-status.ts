/**
 * Display helpers for Access Control Inspector badges and control labels.
 */

import type {
  AccessControlControl,
  AccessControlStatus,
} from "../../../../lib/visudev/access-control-types";
import { accessControlStatusSymbol } from "../../../../lib/visudev/access-control-types";

export const CONTROL_LABELS: Record<AccessControlControl, string> = {
  authentication: "Authentifizierung",
  authorization: "Autorisierung",
  "resource-scope": "Resource Scope",
  "tenant-isolation": "Tenant-Isolation",
  ownership: "Ownership",
  "read-restriction": "Lese-Beschränkung",
  "write-restriction": "Schreib-Beschränkung",
  validation: "Validation",
  "rate-limit": "Rate Limit",
  "privileged-access": "Privileged Access",
  audit: "Audit",
  encryption: "Encryption",
};

export function accessControlStatusBadge(status: AccessControlStatus): {
  variant: "confirmed" | "warning" | "missing" | "unknown" | "critical";
  label: string;
} {
  // unsupported must never render as critical red — honest "not available" signal
  if (status === "protected" || status === "not-applicable") {
    return { variant: "confirmed", label: `${accessControlStatusSymbol(status)} OK` };
  }
  if (status === "unsupported") {
    return { variant: "unknown", label: `${accessControlStatusSymbol(status)} Nicht unterstützt` };
  }
  if (status === "missing") {
    return { variant: "missing", label: `${accessControlStatusSymbol(status)} Fehlt` };
  }
  if (status === "partial") {
    return { variant: "warning", label: `${accessControlStatusSymbol(status)} Teilweise` };
  }
  return { variant: "unknown", label: `${accessControlStatusSymbol(status)} Ungeprüft` };
}
