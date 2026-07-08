/** Thin wrapper that delegates scoped fact mapping to the dispatcher. */

import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import type {
  VisuDevEdge,
  VisuDevNode,
} from "../../dto/graph/visudev-graph.dto.ts";
import type { RouteScope } from "../../dto/blueprint/route-scope.dto.ts";
import { dispatchFactToScope } from "./fact-graph.dispatch.ts";
import type { FactDispatchContext } from "./fact-graph.dispatch-context.ts";
import type { EvidenceIndex } from "./fact-graph-evidence.ts";
import type { ScopeControlNodes } from "./fact-graph.types.ts";

export type { ScopeControlNodes };

export function applyFactToScope(
  fact: CodeFact,
  evidenceId: string,
  evidence: EvidenceIndex,
  route: RouteScope,
  routeNodeId: string,
  controlNodes: ScopeControlNodes,
  nodes: VisuDevNode[],
  edges: VisuDevEdge[],
  nodeById: Map<string, VisuDevNode>,
  edgeById: Map<string, VisuDevEdge>,
  scopeNodeIds: Set<string>,
  scopeEdgeIds: Set<string>,
  idRegistry: Set<string>,
  tableByLabel: Map<string, string>,
  idStemCounters: Map<string, number>,
): void {
  const ctx: FactDispatchContext = {
    evidence,
    route,
    routeNodeId,
    controlNodes,
    nodes,
    edges,
    nodeById,
    edgeById,
    scopeNodeIds,
    scopeEdgeIds,
    idRegistry,
    idStemCounters,
    tableByLabel,
  };
  dispatchFactToScope(fact, evidenceId, ctx);
}
