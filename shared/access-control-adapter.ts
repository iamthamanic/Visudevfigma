/**
 * Database security adapter contract — kept separate from domain types so
 * dialect/parser implementations can evolve without touching matrix UI types.
 */

import type { AccessControlFinding, DatabaseSecurityDialect } from "./access-control.types.js";

export interface DatabaseSecurityAdapterInput {
  projectId: string;
  facts: Array<{
    id: string;
    kind: string;
    filePath: string;
    line: number;
    snippet: string;
  }>;
  /** Detected or configured dialect; adapters may no-op if mismatch. */
  dialect: DatabaseSecurityDialect;
  /** Route/table scope ids from SoftwareGraph when available. */
  resourceIds?: string[];
}

/** Contract for technology-specific security detection. */
export interface DatabaseSecurityAdapter {
  dialect: DatabaseSecurityDialect;
  analyze(input: DatabaseSecurityAdapterInput): AccessControlFinding[];
}
