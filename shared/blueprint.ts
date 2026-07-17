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
  DatabaseSecurityAdapter,
  DatabaseSecurityAdapterInput,
  DatabaseSecurityDialect,
  EnforcementLayer,
} from "./access-control.types.js";
export {
  ACCESS_CONTROL_STATUS_RANK,
  accessControlStatusSymbol,
  worstAccessControlStatus,
} from "./access-control.types.js";
