/**
 * Application chain analyzer — walks SoftwareGraph route → auth → service →
 * repository → data edges and emits stack-agnostic AccessControlFinding rows.
 * Bridges legacy file-scoped route edge + snippet signals (leave auth-check /
 * leave-route-db-fact) so AC v2 matches securityMatrix without force-green.
 */

import {
  buildRouteFactsIndexes,
  collectRouteEdgeSignals,
  collectRouteSnippetSignals,
} from "../../../../shared/blueprint-graph-inference.js";
import type { AccessControlFinding } from "../../../../shared/access-control.types.js";
import type {
  ProjectedCodeFact,
  ProjectedRoute,
} from "../../../../shared/blueprint-graph-types.js";
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

function projectedRouteId(route: SoftwareGraphNode): string {
  return typeof route.metadata.routeId === "string" && route.metadata.routeId.length > 0
    ? route.metadata.routeId
    : route.id;
}

function evidenceAsFacts(graph: SoftwareGraph): ProjectedCodeFact[] {
  return graph.evidence.map((item) => ({
    id: item.factId || item.id,
    kind: item.kind,
    filePath: item.filePath,
    line: item.line,
    snippet: item.excerpt,
    metadata: {},
  }));
}

function projectedRoutesFromNodes(routes: SoftwareGraphNode[]): ProjectedRoute[] {
  return routes
    .filter((r) => typeof r.filePath === "string" && r.filePath.length > 0)
    .map((r) => ({
      id: projectedRouteId(r),
      method: typeof r.metadata.method === "string" ? r.metadata.method : "ALL",
      path: typeof r.metadata.path === "string" ? r.metadata.path : r.label,
      filePath: r.filePath!,
      line: routeLine(r),
      pipeline: [] as [],
      concepts: {},
    }));
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
  const snippetIndexes = buildRouteFactsIndexes(
    projectedRoutesFromNodes(routes),
    evidenceAsFacts(graph),
  );

  const findings: AccessControlFinding[] = [];

  for (const route of routes) {
    const resourceId = projectedRouteId(route);
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
    const snippetSignals =
      route.filePath && route.filePath.length > 0
        ? collectRouteSnippetSignals({ id: resourceId, filePath: route.filePath }, snippetIndexes)
        : { hasAuth: false, hasValidation: false, hasRole: false, evidence: [] };

    const chainEvidence = mergeEvidence(
      mergeEvidence(collectChainEvidence(nodeIds, evidenceByNode), edgeSignals.evidence),
      snippetSignals.evidence,
    );
    const signals = detectChainSignals(chainEvidence);
    if (snippetSignals.hasRole) {
      signals.hasRole = true;
    }
    const hasAuth = edgeKinds.has("authenticates") || edgeSignals.hasAuth || snippetSignals.hasAuth;
    const hasValidation =
      edgeKinds.has("validates") || edgeSignals.hasValidation || snippetSignals.hasValidation;
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
