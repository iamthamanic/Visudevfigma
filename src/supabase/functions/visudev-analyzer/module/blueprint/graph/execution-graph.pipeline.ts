/** Derives RouteBlueprint.pipeline order from VisuDevGraph edge traversal. */

import type {
  ConceptState,
  PipelineNode,
  TechnicalConcept,
} from "../../dto/blueprint/blueprint-document.dto.ts";
import type { RouteScope } from "../../dto/blueprint/route-scope.dto.ts";
import type {
  DetectionState,
  VisuDevEdge,
  VisuDevEdgeKind,
  VisuDevGraph,
  VisuDevNode,
} from "../../dto/graph/visudev-graph.dto.ts";

const EXECUTION_EDGE_KINDS = new Set<VisuDevEdgeKind>([
  "authenticates",
  "validates",
  "rate_limits",
  "writes",
  "reads",
  "calls",
]);

const PRE_HANDLER_EDGE_ORDER: VisuDevEdgeKind[] = [
  "authenticates",
  "validates",
  "rate_limits",
];

const POST_HANDLER_EDGE_ORDER: VisuDevEdgeKind[] = [
  "writes",
  "reads",
  "calls",
];

export function buildPipelineFromExecutionGraph(
  route: RouteScope,
  graph: VisuDevGraph,
  routeConcepts: Map<string, TechnicalConcept>,
  templatePipeline: PipelineNode[],
): PipelineNode[] {
  const derived = derivePipelineFromGraph(route, graph, routeConcepts);
  return derived ?? templatePipeline;
}

function derivePipelineFromGraph(
  route: RouteScope,
  graph: VisuDevGraph,
  routeConcepts: Map<string, TechnicalConcept>,
): PipelineNode[] | null {
  const scope = graph.scopes.find((entry) => entry.id === route.id);
  if (!scope) return null;

  const routeNode = findRouteNode(graph, scope.nodeIds, route.id);
  if (!routeNode) return null;

  const scopeEdgeIds = new Set(scope.edgeIds);
  const outgoing = graph.edges.filter((edge) =>
    edge.fromNodeId === routeNode.id && scopeEdgeIds.has(edge.id)
  );
  const executionEdges = outgoing.filter((edge) =>
    EXECUTION_EDGE_KINDS.has(edge.kind)
  );
  if (executionEdges.length === 0) return null;

  const pipeline: PipelineNode[] = [{
    id: `${route.id}:request`,
    type: "request",
    label: "Request",
    state: "confirmed",
  }];

  for (const edgeKind of PRE_HANDLER_EDGE_ORDER) {
    appendPipelineNodesForEdges(
      pipeline,
      route,
      executionEdges,
      edgeKind,
      graph.nodes,
      routeConcepts,
    );
  }

  insertRoleFromConcepts(pipeline, route, routeConcepts);

  pipeline.push({
    id: `${route.id}:handler`,
    type: "handler",
    label: "Handler",
    state: "confirmed",
    filePath: route.filePath,
    line: route.line,
  });

  for (const edgeKind of POST_HANDLER_EDGE_ORDER) {
    appendPipelineNodesForEdges(
      pipeline,
      route,
      executionEdges,
      edgeKind,
      graph.nodes,
      routeConcepts,
    );
  }

  return pipeline.filter((node) =>
    node.state !== "missing" || node.type !== "role-gate"
  );
}

function findRouteNode(
  graph: VisuDevGraph,
  scopeNodeIds: string[],
  routeId: string,
): VisuDevNode | undefined {
  const scopeNodeSet = new Set(scopeNodeIds);
  return graph.nodes.find((node) =>
    scopeNodeSet.has(node.id) &&
    node.kind === "route" &&
    (node.scopeId === routeId ||
      node.label.includes(routeId.split(" ")[0] ?? ""))
  ) ?? graph.nodes.find((node) =>
    scopeNodeSet.has(node.id) && node.kind === "route"
  );
}

function appendPipelineNodesForEdges(
  pipeline: PipelineNode[],
  route: RouteScope,
  edges: VisuDevEdge[],
  edgeKind: VisuDevEdgeKind,
  nodes: VisuDevNode[],
  routeConcepts: Map<string, TechnicalConcept>,
): void {
  for (const edge of edges.filter((entry) => entry.kind === edgeKind)) {
    const targetNode = nodes.find((node) => node.id === edge.toNodeId);
    if (!targetNode) continue;
    const pipelineNode = mapGraphNodeToPipeline(
      route,
      targetNode,
      edge.kind,
      routeConcepts,
    );
    if (!pipelineNode) continue;
    if (pipeline.some((entry) => entry.type === pipelineNode.type)) continue;
    pipeline.push(pipelineNode);
  }
}

function mapGraphNodeToPipeline(
  route: RouteScope,
  node: VisuDevNode,
  edgeKind: VisuDevEdgeKind,
  routeConcepts: Map<string, TechnicalConcept>,
): PipelineNode | null {
  switch (node.kind) {
    case "auth":
      if (edgeKind !== "authenticates") return null;
      return pipelineNodeFromGraph(
        `${route.id}:auth`,
        "auth-gate",
        "Auth",
        node,
        routeConcepts.get("auth-gate"),
      );
    case "validation":
      if (edgeKind !== "validates") return null;
      return pipelineNodeFromGraph(
        `${route.id}:validation`,
        "validation-gate",
        "Validation",
        node,
        routeConcepts.get("validation-gate"),
      );
    case "rate-limit":
      if (edgeKind !== "rate_limits") return null;
      return pipelineNodeFromGraph(
        `${route.id}:rate-limit`,
        "rate-limit",
        "Rate limit",
        node,
        routeConcepts.get("rate-limit"),
      );
    case "table":
      if (edgeKind === "writes") {
        return pipelineNodeFromGraph(
          `${route.id}:db`,
          "db-write",
          "DB",
          node,
          routeConcepts.get("db-write"),
        );
      }
      if (edgeKind === "reads") {
        return pipelineNodeFromGraph(
          `${route.id}:db-read`,
          "db-read",
          "DB read",
          node,
          routeConcepts.get("db-read"),
        );
      }
      return null;
    case "external_api":
      if (edgeKind !== "calls") return null;
      return pipelineNodeFromGraph(
        `${route.id}:external`,
        "external-api",
        "External",
        node,
        routeConcepts.get("external-api"),
      );
    default:
      return null;
  }
}

function pipelineNodeFromGraph(
  id: string,
  type: PipelineNode["type"],
  label: string,
  node: VisuDevNode,
  concept?: TechnicalConcept,
): PipelineNode {
  const graphState = mapDetectionToConceptState(node.state);
  const state = concept?.state && graphState === "confirmed"
    ? concept.state
    : graphState;
  return {
    id,
    type,
    label,
    state,
    filePath: node.filePath ?? concept?.callPath?.[0],
    line: node.line,
  };
}

function mapDetectionToConceptState(state: DetectionState): ConceptState {
  if (state === "confirmed") return "confirmed";
  if (state === "missing") return "missing";
  return "unknown";
}

function insertRoleFromConcepts(
  pipeline: PipelineNode[],
  route: RouteScope,
  routeConcepts: Map<string, TechnicalConcept>,
): void {
  const roleConcept = routeConcepts.get("role-gate");
  const roleNode: PipelineNode = {
    id: `${route.id}:role`,
    type: "role-gate",
    label: "Role",
    state: roleConcept?.state ?? "missing",
    filePath: roleConcept?.callPath?.[0],
  };

  const authIndex = pipeline.findIndex((node) => node.type === "auth-gate");
  const validationIndex = pipeline.findIndex((node) =>
    node.type === "validation-gate"
  );
  const insertAt = validationIndex >= 0
    ? validationIndex
    : authIndex >= 0
    ? authIndex + 1
    : pipeline.length;
  pipeline.splice(insertAt, 0, roleNode);
}
