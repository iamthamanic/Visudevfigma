/**
 * Stable shared export surface for blueprint graph projections.
 */

export {
  deriveDiagnosticsFromGraph,
  deriveFactsFromGraph,
  deriveFindingsFromGraph,
  deriveRoutesFromGraph,
  deriveSecurityMatrixFromGraph,
} from "./blueprint-graph-projections.js";

export { synthesizeSecurityMatrixFromAccessControl } from "./synthesize-security-matrix.js";
export { deriveAccessControlMatrixFromFindings } from "./access-control-matrix.js";
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
} from "./access-control.types.js";
export type {
  DatabaseSecurityAdapter,
  DatabaseSecurityAdapterInput,
} from "./access-control-adapter.js";
export {
  ACCESS_CONTROL_STATUS_RANK,
  accessControlStatusSymbol,
  worstAccessControlStatus,
} from "./access-control-status.js";
