/**
 * Matrix column ↔ access-control control mapping (shared by matrix + inspector).
 */

import type { AccessControlControl } from "../../../../lib/visudev/access-control-types";

export type MatrixControlColumn =
  | "authentication"
  | "authorization"
  | "resourceScope"
  | "tenantIsolation"
  | "ownership"
  | "validation"
  | "rateLimit"
  | "audit";

export const MATRIX_COLUMN_TO_CONTROL: Record<MatrixControlColumn, AccessControlControl> = {
  authentication: "authentication",
  authorization: "authorization",
  resourceScope: "resource-scope",
  tenantIsolation: "tenant-isolation",
  ownership: "ownership",
  validation: "validation",
  rateLimit: "rate-limit",
  audit: "audit",
};
