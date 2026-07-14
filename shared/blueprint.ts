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
  AccessControlFinding,
  AccessControlMatrixRow,
  AccessControlMechanism,
  AccessControlStatus,
  DatabaseSecurityDialect,
} from "./access-control.types.js";
