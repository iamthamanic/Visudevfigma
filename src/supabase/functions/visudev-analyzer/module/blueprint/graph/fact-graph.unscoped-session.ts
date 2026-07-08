/** Unscoped route session bootstrap for VisuDevGraph fallback mapping. */

import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import type { RouteScope } from "../../dto/blueprint/route-scope.dto.ts";
import type {
  VisuDevEdge,
  VisuDevNode,
} from "../../dto/graph/visudev-graph.dto.ts";
import type { EvidenceIndex } from "./fact-graph-evidence.ts";
import { type FactDispatchContext } from "./fact-graph.dispatch-context.ts";
import { dispatchFactToScope } from "./fact-graph.dispatch.ts";
import { ensureRouteNode } from "./fact-graph.nodes.ts";
import { ensureControlNodesForUnscopedFact } from "./fact-graph.unscoped-controls.ts";
import { validateRouteFact } from "./fact-graph.validate.ts";
import { routeNodeIdForScope } from "./graph-id.util.ts";

export interface UnscopedRouteContext {
  route: RouteScope;
  routeNodeId: string;
  validationNodeId?: string;
  authNodeId?: string;
  scopeNodeIds: Set<string>;
  scopeEdgeIds: Set<string>;
}

export function beginUnscopedRoute(
  fact: CodeFact,
  evidence: EvidenceIndex,
  evidenceId: string,
  nodes: VisuDevNode[],
  edges: VisuDevEdge[],
  nodeById: Map<string, VisuDevNode>,
  edgeById: Map<string, VisuDevEdge>,
  idRegistry: Set<string>,
  tableByLabel: Map<string, string>,
  idStemCounters: Map<string, number>,
): UnscopedRouteContext | null {
  const routeMeta = validateRouteFact(fact);
  if (!routeMeta) return null;
  const { method, path } = routeMeta;
  const scopeId = `${method} ${path}`;
  const route: RouteScope = {
    id: scopeId,
    method,
    path,
    filePath: fact.filePath,
    line: fact.line,
    relatedFiles: [fact.filePath],
  };
  const routeNodeId = routeNodeIdForScope(
    scopeId,
    idRegistry,
    idStemCounters,
  );
  ensureRouteNode(nodes, nodeById, route, routeNodeId);
  const scopeNodeIds = new Set<string>([routeNodeId]);
  const scopeEdgeIds = new Set<string>();
  const context: UnscopedRouteContext = {
    route,
    routeNodeId,
    scopeNodeIds,
    scopeEdgeIds,
  };
  applyFactToUnscopedRoute(
    fact,
    evidenceId,
    evidence,
    context,
    nodes,
    edges,
    nodeById,
    edgeById,
    idRegistry,
    tableByLabel,
    idStemCounters,
  );
  return context;
}

export function applyFactToUnscopedRoute(
  fact: CodeFact,
  evidenceId: string,
  evidence: EvidenceIndex,
  context: UnscopedRouteContext,
  nodes: VisuDevNode[],
  edges: VisuDevEdge[],
  nodeById: Map<string, VisuDevNode>,
  edgeById: Map<string, VisuDevEdge>,
  idRegistry: Set<string>,
  tableByLabel: Map<string, string>,
  idStemCounters: Map<string, number>,
): void {
  ensureControlNodesForUnscopedFact(
    fact,
    context,
    nodes,
    nodeById,
    idRegistry,
    idStemCounters,
  );
  const dispatchCtx: FactDispatchContext = {
    evidence,
    route: context.route,
    routeNodeId: context.routeNodeId,
    controlNodes: {
      validationNodeId: context.validationNodeId,
      authNodeId: context.authNodeId,
    },
    nodes,
    edges,
    nodeById,
    edgeById,
    scopeNodeIds: context.scopeNodeIds,
    scopeEdgeIds: context.scopeEdgeIds,
    idRegistry,
    idStemCounters,
    tableByLabel,
  };
  dispatchFactToScope(fact, evidenceId, dispatchCtx);
}
