/** Scoped RouteScope graph assembly for VisuDevGraph. */

import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import type { RouteScope } from "../../dto/blueprint/route-scope.dto.ts";
import type { VisuDevScope } from "../../dto/graph/visudev-graph.dto.ts";
import { buildRouteFactsIndex } from "../internal/fact-scope-index.ts";
import type { GraphBuildContext } from "./fact-graph.context.ts";
import { ensureControlNode, ensureRouteNode } from "./fact-graph.nodes.ts";
import { applyFactToScope } from "./fact-graph.rules.ts";
import { mapUnscopedFacts } from "./fact-graph.unscoped.ts";
import { createUniqueGraphId, routeNodeIdForScope } from "./graph-id.util.ts";

const VALIDATION_FACT_KINDS = new Set([
  "schema-safe-parse",
  "schema-parse",
  "validation-deny-400",
]);

const AUTH_FACT_KINDS = new Set(["auth-check", "auth-deny-401"]);

export function buildScopedGraph(
  facts: CodeFact[],
  routeScopes: RouteScope[],
  ctx: GraphBuildContext,
): void {
  const routeFactsIndex = buildRouteFactsIndex(routeScopes, facts);

  for (const route of routeScopes) {
    const scopeFacts = routeFactsIndex.get(route.id) ?? [];
    mapRouteScope(route, scopeFacts, ctx);
  }

  mapUnmappedScopedFacts(facts, routeFactsIndex, ctx);
}

function mapRouteScope(
  route: RouteScope,
  scopeFacts: CodeFact[],
  ctx: GraphBuildContext,
): void {
  const routeNodeId = routeNodeIdForScope(
    route.id,
    ctx.idRegistry,
    ctx.idStemCounters,
  );
  ensureRouteNode(ctx.nodes, ctx.nodeById, route, routeNodeId);
  const scopeNodeIds = new Set<string>([routeNodeId]);
  const scopeEdgeIds = new Set<string>();

  const validationNodeId = ensureValidationNode(
    route,
    scopeFacts,
    ctx,
    scopeNodeIds,
  );
  const authNodeId = ensureAuthNode(route, scopeFacts, ctx, scopeNodeIds);

  for (const fact of scopeFacts) {
    applyFactToScope(
      fact,
      ctx.evidence.idForFact(fact),
      ctx.evidence,
      route,
      routeNodeId,
      { validationNodeId, authNodeId },
      ctx.nodes,
      ctx.edges,
      ctx.nodeById,
      ctx.edgeById,
      scopeNodeIds,
      scopeEdgeIds,
      ctx.idRegistry,
      ctx.tableByLabel,
      ctx.idStemCounters,
    );
  }

  ctx.scopes.push(buildRouteScope(route, scopeNodeIds, scopeEdgeIds));
}

function ensureValidationNode(
  route: RouteScope,
  scopeFacts: CodeFact[],
  ctx: GraphBuildContext,
  scopeNodeIds: Set<string>,
): string | undefined {
  if (!scopeFacts.some((fact) => VALIDATION_FACT_KINDS.has(fact.kind))) {
    return undefined;
  }
  const validationNodeId = createUniqueGraphId(
    "node-validation",
    route.id,
    ctx.idRegistry,
    ctx.idStemCounters,
  );
  ensureControlNode(
    ctx.nodes,
    ctx.nodeById,
    validationNodeId,
    "validation",
    "Validation",
    route.id,
    route.filePath,
    route.line,
    "confirmed",
  );
  scopeNodeIds.add(validationNodeId);
  return validationNodeId;
}

function ensureAuthNode(
  route: RouteScope,
  scopeFacts: CodeFact[],
  ctx: GraphBuildContext,
  scopeNodeIds: Set<string>,
): string | undefined {
  if (!scopeFacts.some((fact) => AUTH_FACT_KINDS.has(fact.kind))) {
    return undefined;
  }
  const authNodeId = createUniqueGraphId(
    "node-auth",
    route.id,
    ctx.idRegistry,
    ctx.idStemCounters,
  );
  ensureControlNode(
    ctx.nodes,
    ctx.nodeById,
    authNodeId,
    "auth",
    "Auth",
    route.id,
    route.filePath,
    route.line,
    "confirmed",
  );
  scopeNodeIds.add(authNodeId);
  return authNodeId;
}

function buildRouteScope(
  route: RouteScope,
  scopeNodeIds: Set<string>,
  scopeEdgeIds: Set<string>,
): VisuDevScope {
  return {
    id: route.id,
    kind: "route",
    label: `${route.method} ${route.path}`,
    nodeIds: [...scopeNodeIds],
    edgeIds: [...scopeEdgeIds],
    metadata: {
      method: route.method,
      path: route.path,
      filePath: route.filePath,
      line: route.line,
    },
  };
}

function mapUnmappedScopedFacts(
  facts: CodeFact[],
  routeFactsIndex: Map<string, CodeFact[]>,
  ctx: GraphBuildContext,
): void {
  const mappedFacts = new Set<CodeFact>();
  for (const scopeFacts of routeFactsIndex.values()) {
    for (const fact of scopeFacts) mappedFacts.add(fact);
  }
  const unmappedFacts = facts.filter((fact) => !mappedFacts.has(fact));
  if (unmappedFacts.length === 0) return;
  mapUnscopedFacts(
    unmappedFacts,
    ctx.evidence,
    ctx.nodes,
    ctx.edges,
    ctx.nodeById,
    ctx.edgeById,
    ctx.idRegistry,
    ctx.tableByLabel,
    ctx.idStemCounters,
  );
}
