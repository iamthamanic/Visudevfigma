/** Builds SecurityMatrixRow[] from VisuDevGraph route scope subgraphs. */

import type {
  BlueprintFinding,
  ConceptState,
  RouteBlueprint,
  SecurityMatrixCell,
  SecurityMatrixRow,
} from "../../dto/blueprint/blueprint-document.dto.ts";
import type {
  DetectionState,
  VisuDevGraph,
  VisuDevNode,
  VisuDevScope,
} from "../../dto/graph/visudev-graph.dto.ts";

export function buildSecurityMatrixFromGraph(
  routes: RouteBlueprint[],
  graph: VisuDevGraph,
  findings: BlueprintFinding[],
): SecurityMatrixRow[] {
  const findingsByRoute = indexFindingsByRoute(findings);

  return routes.map((route) => {
    const legacyRow = buildLegacyMatrixRow(route, findingsByRoute);
    const scope = graph.scopes.find((entry) => entry.id === route.id);
    if (!scope) return legacyRow;

    const graphCells = deriveMatrixCellsFromScope(graph, scope);
    return {
      ...legacyRow,
      auth: graphCells.auth,
      validation: graphCells.validation,
      rateLimit: graphCells.rateLimit,
      db: graphCells.db,
    };
  });
}

function indexFindingsByRoute(
  findings: BlueprintFinding[],
): Map<string, BlueprintFinding[]> {
  const findingsByRoute = new Map<string, BlueprintFinding[]>();
  for (const finding of findings) {
    const routeFindings = findingsByRoute.get(finding.scopeId);
    if (routeFindings) {
      routeFindings.push(finding);
    } else {
      findingsByRoute.set(finding.scopeId, [finding]);
    }
  }
  return findingsByRoute;
}

function buildLegacyMatrixRow(
  route: RouteBlueprint,
  findingsByRoute: Map<string, BlueprintFinding[]>,
): SecurityMatrixRow {
  const routeFindings = findingsByRoute.get(route.id) ?? [];
  return {
    routeId: route.id,
    method: route.method,
    path: route.path,
    auth: cell(route.concepts["auth-gate"]),
    role: cell(route.concepts["role-gate"]),
    validation: cell(route.concepts["validation-gate"]),
    rateLimit: cell(route.concepts["rate-limit"]),
    db: dbCellFromConcepts(route.concepts),
    rls: cell(route.concepts["rls-policy"]),
    audit: cell(route.concepts["audit-log"]),
    findingCount: routeFindings.length,
  };
}

interface GraphMatrixCells {
  auth: SecurityMatrixCell;
  validation: SecurityMatrixCell;
  rateLimit: SecurityMatrixCell;
  db: SecurityMatrixCell;
}

function deriveMatrixCellsFromScope(
  graph: VisuDevGraph,
  scope: VisuDevScope,
): GraphMatrixCells {
  const routeNode = findRouteNodeInScope(graph, scope);
  if (!routeNode) {
    return {
      auth: { state: "unknown" },
      validation: { state: "unknown" },
      rateLimit: { state: "unknown" },
      db: { state: "unknown" },
    };
  }

  const scopeEdgeIds = new Set(scope.edgeIds);
  const outgoing = graph.edges.filter((edge) =>
    edge.fromNodeId === routeNode.id && scopeEdgeIds.has(edge.id)
  );

  return {
    auth: controlCellFromEdge(
      graph,
      outgoing,
      "authenticates",
      "auth",
    ),
    validation: controlCellFromEdge(
      graph,
      outgoing,
      "validates",
      "validation",
    ),
    rateLimit: controlCellFromEdge(
      graph,
      outgoing,
      "rate_limits",
      "rate-limit",
    ),
    db: dbCellFromGraph(graph, outgoing),
  };
}

function findRouteNodeInScope(
  graph: VisuDevGraph,
  scope: VisuDevScope,
): VisuDevNode | undefined {
  const scopeNodeIds = new Set(scope.nodeIds);
  return graph.nodes.find((node) =>
    scopeNodeIds.has(node.id) && node.kind === "route"
  );
}

function controlCellFromEdge(
  graph: VisuDevGraph,
  outgoingEdges: VisuDevGraph["edges"],
  edgeKind: VisuDevGraph["edges"][number]["kind"],
  targetKind: VisuDevNode["kind"],
): SecurityMatrixCell {
  const edge = outgoingEdges.find((entry) => entry.kind === edgeKind);
  if (!edge) return { state: "unknown" };
  const targetNode = graph.nodes.find((node) =>
    node.id === edge.toNodeId && node.kind === targetKind
  );
  if (!targetNode) return { state: "unknown" };
  return { state: mapDetectionToConceptState(targetNode.state) };
}

function dbCellFromGraph(
  graph: VisuDevGraph,
  outgoingEdges: VisuDevGraph["edges"],
): SecurityMatrixCell {
  const dbEdges = outgoingEdges.filter((edge) =>
    edge.kind === "writes" || edge.kind === "reads"
  );
  if (dbEdges.length === 0) return { state: "unknown" };

  const hasConfirmed = dbEdges.some((edge) => {
    const tableNode = graph.nodes.find((node) =>
      node.id === edge.toNodeId && node.kind === "table"
    );
    return tableNode?.state === "confirmed";
  });
  return { state: hasConfirmed ? "confirmed" : "unknown" };
}

function cell(state?: ConceptState): SecurityMatrixCell {
  if (!state) return { state: "unknown" };
  return { state };
}

function dbCellFromConcepts(
  concepts: RouteBlueprint["concepts"],
): SecurityMatrixCell {
  if (concepts["db-write"] === "confirmed") return { state: "confirmed" };
  if (concepts["db-read"] === "confirmed") return { state: "confirmed" };
  return { state: "unknown" };
}

function mapDetectionToConceptState(state: DetectionState): ConceptState {
  if (state === "confirmed") return "confirmed";
  if (state === "missing") return "missing";
  return "unknown";
}
