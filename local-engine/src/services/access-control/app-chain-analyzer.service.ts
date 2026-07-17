/**
 * Application chain analyzer — walks SoftwareGraph route → auth → service →
 * repository → data edges and emits stack-agnostic AccessControlFinding rows.
 * Bridges legacy file-scoped route edge signals (leave-route-db-fact, file→auth)
 * so AC v2 matrix/inspector matches securityMatrix evidence without force-green.
 */

import { collectRouteEdgeSignals } from "../../../../shared/blueprint-graph-inference.js";
import type { AccessControlFinding } from "../../../../shared/access-control.types.js";
import type { SoftwareGraph, SoftwareGraphNode } from "../../../../shared/software-graph.types.js";
import { emitRouteAccessFindings } from "./app-chain-emit.js";
import {
  buildOutgoing,
  collectReachable,
  resolveRouteChainSeeds,
} from "./app-chain-reachability.js";
import {
  collectChainEvidence,
  detectChainSignals,
  indexEvidenceByNode,
  mergeEvidence,
} from "./app-chain-signals.js";

export interface AppChainAnalyzerInput {
  graph: SoftwareGraph;
  routeIds?: string[];
}

function routeLine(route: SoftwareGraphNode): number {
  return typeof route.line === "number" && Number.isFinite(route.line) ? route.line : 0;
}

/**
 * Analyze application-layer enforcement along each route's graph neighborhood.
 */
export function analyzeApplicationChain(input: AppChainAnalyzerInput): AccessControlFinding[] {
  const { graph } = input;
  const nodes = new Map(graph.nodes.map((n) => [n.id, n]));
  const outgoing = buildOutgoing(graph.edges);
  const evidenceByNode = indexEvidenceByNode(graph.evidence);
  const routes = graph.nodes.filter(
    (n) => n.kind === "route" && (!input.routeIds || input.routeIds.includes(n.id)),
  );
  const siblingRoutes = routes
    .filter((r) => typeof r.filePath === "string" && r.filePath.length > 0)
    .map((r) => ({ filePath: r.filePath!, line: routeLine(r) }));

  const findings: AccessControlFinding[] = [];

  for (const route of routes) {
    const resourceId =
      typeof route.metadata.routeId === "string" && route.metadata.routeId.length > 0
        ? route.metadata.routeId
        : route.id;
    const seeds = resolveRouteChainSeeds(route, nodes);
    const { nodeIds, edgeKinds, nodesByKind, truncated } = collectReachable(seeds, outgoing, nodes);
    const edgeSignals =
      route.filePath && route.filePath.length > 0
        ? collectRouteEdgeSignals(
            graph,
            { id: route.id, filePath: route.filePath, line: routeLine(route) },
            siblingRoutes,
            nodes,
          )
        : { hasAuth: false, hasValidation: false, hasDb: false, evidence: [] };

    const chainEvidence = mergeEvidence(
      collectChainEvidence(nodeIds, evidenceByNode),
      edgeSignals.evidence,
    );
    const signals = detectChainSignals(chainEvidence);
    const hasAuth = edgeKinds.has("authenticates") || edgeSignals.hasAuth;
    const hasValidation = edgeKinds.has("validates") || edgeSignals.hasValidation;
    const hasRepo = (nodesByKind.get("repository")?.length ?? 0) > 0;
    const hasTable =
      (nodesByKind.get("table")?.length ?? 0) > 0 || edgeKinds.has("data") || edgeSignals.hasDb;

    findings.push(
      ...emitRouteAccessFindings({
        resourceId,
        chainEvidence,
        signals,
        hasAuth,
        hasValidation,
        touchesData: hasRepo || hasTable,
        hasRepo,
        hasTable,
        truncated,
      }),
    );
  }

  return findings;
}
