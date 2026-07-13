/**
 * Internal types for the Software Graph builder.
 */

export interface Classification {
  nodeKind?: import("../../types/api.types.js").SoftwareGraphNodeKind;
  edgeKind?: import("../../types/api.types.js").SoftwareGraphEdgeKind;
}

export interface IdRegistry {
  nodes: Set<string>;
  edges: Set<string>;
  scopes: Set<string>;
  evidence: Set<string>;
}
