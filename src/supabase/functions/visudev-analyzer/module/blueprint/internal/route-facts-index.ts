/** Maps CodeFacts to owning RouteScope ids for concept and graph builds. */

import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import type { RouteScope } from "../../dto/blueprint/route-scope.dto.ts";
import {
  buildMaxLineByFile,
  buildOwnershipRangesByFile,
  buildSortedRoutesByFile,
  resolveOwnerRouteId,
  type RouteLineRange,
} from "./route-ownership.ts";
import { buildRelatedRouteIdsByFile } from "./route-related-files.ts";
import { resolveRoutePath } from "./route-path.util.ts";

export function buildRouteFactsIndex(
  routeScopes: RouteScope[],
  facts: CodeFact[],
): Map<string, CodeFact[]> {
  const index = new Map<string, CodeFact[]>();
  const routeByFileLine = new Map<string, RouteScope>();
  const routeById = new Map<string, RouteScope>();

  for (const route of routeScopes) {
    index.set(route.id, []);
    routeByFileLine.set(routeScopeLineKey(route), route);
    routeById.set(route.id, route);
  }

  const sortedRoutesByFile = buildSortedRoutesByFile(routeScopes);
  const ownershipRangesByFile = buildOwnershipRangesByFile(
    sortedRoutesByFile,
    buildMaxLineByFile(facts),
  );
  const relatedRouteIdsByFile = buildRelatedRouteIdsByFile(routeScopes);

  const nonRouteFactsByFile = new Map<string, CodeFact[]>();

  for (const fact of facts) {
    if (fact.kind === "api-route") {
      const method = String(fact.metadata.method ?? "GET").toUpperCase();
      const path = resolveRoutePath(fact);
      const route = routeByFileLine.get(
        `${fact.filePath}:${fact.line}:${method}:${path}`,
      );
      if (route) index.get(route.id)?.push(fact);
      continue;
    }

    const fileFacts = nonRouteFactsByFile.get(fact.filePath) ?? [];
    fileFacts.push(fact);
    nonRouteFactsByFile.set(fact.filePath, fileFacts);
  }

  for (const [filePath, fileFacts] of nonRouteFactsByFile) {
    const routeIds = relatedRouteIdsByFile.get(filePath);
    if (!routeIds?.size) continue;

    const unownedFacts: CodeFact[] = [];

    for (const fact of fileFacts) {
      if (fact.kind === "ast-import" || fact.kind === "ast-call") continue;
      const ownerId = resolveOwnerRouteId(
        filePath,
        fact.line,
        ownershipRangesByFile,
      );
      if (ownerId && routeIds.has(ownerId)) {
        index.get(ownerId)?.push(fact);
      } else if (!ownerId) {
        unownedFacts.push(fact);
      }
    }

    if (unownedFacts.length === 0) continue;

    assignSharedFileFacts(
      filePath,
      unownedFacts,
      routeIds,
      routeById,
      index,
    );
  }

  attachAstCallFacts(routeScopes, facts, ownershipRangesByFile, index);

  return index;
}

function assignSharedFileFacts(
  filePath: string,
  facts: CodeFact[],
  routeIds: Set<string>,
  routeById: Map<string, RouteScope>,
  index: Map<string, CodeFact[]>,
): void {
  if (routeIds.size > 1) {
    return;
  }

  if (routeIds.size === 1) {
    const [onlyRouteId] = routeIds;
    const onlyRoute = routeById.get(onlyRouteId);
    if (onlyRoute && filePath !== onlyRoute.filePath) {
      index.get(onlyRouteId)?.push(...facts);
    }
  }
}

function routeScopeLineKey(route: RouteScope): string {
  return `${route.filePath}:${route.line}:${route.method}:${route.path}`;
}

function attachAstCallFacts(
  routeScopes: RouteScope[],
  facts: CodeFact[],
  ownershipRangesByFile: Map<string, RouteLineRange[]>,
  index: Map<string, CodeFact[]>,
): void {
  const factsByFile = new Map<string, CodeFact[]>();
  for (const fact of facts) {
    if (fact.kind === "ast-import" || fact.kind === "ast-call") continue;
    const fileFacts = factsByFile.get(fact.filePath) ?? [];
    fileFacts.push(fact);
    factsByFile.set(fact.filePath, fileFacts);
  }

  const astCalls = facts.filter((fact) => fact.kind === "ast-call");
  const attached = new Map<string, Set<string>>();

  for (const route of routeScopes) {
    const routeFacts = index.get(route.id) ?? [];
    const routeFactIds = attached.get(route.id) ?? new Set<string>();
    attached.set(route.id, routeFactIds);

    for (const callFact of astCalls) {
      if (callFact.filePath !== route.filePath) continue;
      const ownerId = resolveOwnerRouteId(
        callFact.filePath,
        callFact.line,
        ownershipRangesByFile,
      );
      if (ownerId !== route.id) continue;

      const targetFile = String(callFact.metadata.targetFile ?? "").trim();
      if (!targetFile) continue;

      for (const remoteFact of factsByFile.get(targetFile) ?? []) {
        if (routeFactIds.has(remoteFact.id)) continue;
        routeFacts.push(remoteFact);
        routeFactIds.add(remoteFact.id);
      }
    }

    index.set(route.id, routeFacts);
  }
}
