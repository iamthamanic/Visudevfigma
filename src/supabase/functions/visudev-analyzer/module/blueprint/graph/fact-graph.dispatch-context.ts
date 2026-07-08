/** Bundled mutable state passed to VisuDevGraph fact dispatch handlers. */

import type {
  VisuDevEdge,
  VisuDevNode,
} from "../../dto/graph/visudev-graph.dto.ts";
import type { RouteScope } from "../../dto/blueprint/route-scope.dto.ts";
import type { EvidenceIndex } from "./fact-graph-evidence.ts";
import type { ScopeControlNodes } from "./fact-graph.types.ts";

export interface FactDispatchContext {
  evidence: EvidenceIndex;
  route: RouteScope;
  routeNodeId: string;
  controlNodes: ScopeControlNodes;
  nodes: VisuDevNode[];
  edges: VisuDevEdge[];
  nodeById: Map<string, VisuDevNode>;
  edgeById: Map<string, VisuDevEdge>;
  scopeNodeIds: Set<string>;
  scopeEdgeIds: Set<string>;
  idRegistry: Set<string>;
  idStemCounters: Map<string, number>;
  tableByLabel: Map<string, string>;
}
