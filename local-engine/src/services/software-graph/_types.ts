/**
 * Internal types for the Software Graph builder.
 */

import type { SoftwareGraphEdgeKind, SoftwareGraphNodeKind } from "../../types/api.types.js";

export interface Classification {
  nodeKind?: SoftwareGraphNodeKind;
  edgeKind?: SoftwareGraphEdgeKind;
}

export interface IdRegistry {
  nodes: Set<string>;
  edges: Set<string>;
  scopes: Set<string>;
}
