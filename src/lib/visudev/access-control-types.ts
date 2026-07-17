/**
 * Re-export stack-agnostic access control types for Blueprint UI.
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
  DatabaseSecurityDialect,
  EnforcementLayer,
  LegacyConceptState,
} from "../../../shared/access-control.types";

export type {
  DatabaseSecurityAdapter,
  DatabaseSecurityAdapterInput,
} from "../../../shared/access-control-adapter";

export {
  ACCESS_CONTROL_STATUS_RANK,
  accessControlStatusSymbol,
  worstAccessControlStatus,
} from "../../../shared/access-control-status";

export { deriveAccessControlMatrixFromFindings } from "../../../shared/access-control-matrix";
