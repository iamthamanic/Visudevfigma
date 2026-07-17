/**
 * Re-export stack-agnostic access control types for Blueprint UI.
 * Location: src/lib/visudev/access-control-types.ts
 */

export type {
  AccessControlControl,
  AccessControlEvidence,
  AccessControlFinding,
  AccessControlMatrixCell,
  AccessControlMatrixRow,
  AccessControlMechanism,
  AccessControlMechanismDetail,
  AccessControlStatus,
  DatabaseSecurityAdapter,
  DatabaseSecurityAdapterInput,
  DatabaseSecurityDialect,
  EnforcementLayer,
  LegacyConceptState,
} from "../../../shared/access-control.types";

export {
  ACCESS_CONTROL_STATUS_RANK,
  accessControlStatusSymbol,
  worstAccessControlStatus,
} from "../../../shared/access-control.types";

export { deriveAccessControlMatrixFromFindings } from "../../../shared/access-control-matrix";
