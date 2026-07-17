/**
 * Local re-exports of shared access-control types for adapters/services.
 * Keeps adapter imports shallow and stable under local-engine/.
 */

export type {
  DatabaseSecurityAdapter,
  DatabaseSecurityAdapterInput,
} from "../../../../shared/access-control-adapter.js";
export type {
  AccessControlEvidence,
  AccessControlFinding,
  AccessControlMechanismDetail,
  AccessControlStatus,
  DatabaseSecurityDialect,
} from "../../../../shared/access-control.types.js";
