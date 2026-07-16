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
  const routesByLocation = new Map<string, RouteScope[]>();
  const routeById = new Map<string, RouteScope>();

  for (const route of routeScopes) {
    index.set(route.id, []);
    const locationKey = `${route.filePath}:${route.line}:${route.method}`;
    const atLocation = routesByLocation.get(locationKey) ?? [];
    atLocation.push(route);
    routesByLocation.set(locationKey, atLocation);
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
      const rawPath = resolveRoutePath(fact);
      const candidates = routesByLocation.get(
        `${fact.filePath}:${fact.line}:${method}`,
      ) ?? [];
      const route = matchRouteScopeForFact(candidates, rawPath);
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

/**
 * Prefer exact path match; else uniquely match mounted scope whose path ends
 * with the extracted router path (mount join). Ambiguous candidates → no attach.
 */
function matchRouteScopeForFact(
  candidates: RouteScope[],
  rawPath: string,
): RouteScope | undefined {
  if (candidates.length === 0) return undefined;
  const exact = candidates.find((route) => route.path === rawPath);
  if (exact) return exact;
  if (candidates.length === 1) {
    const only = candidates[0]!;
    if (
      only.path === rawPath ||
      only.path.endsWith(rawPath) ||
      only.path.endsWith(`/${rawPath.replace(/^\//, "")}`)
    ) {
      return only;
    }
    return undefined;
  }
  const mounted = candidates.filter((route) =>
    route.path.endsWith(rawPath) ||
    route.path.endsWith(`/${rawPath.replace(/^\//, "")}`)
  );
  return mounted.length === 1 ? mounted[0] : undefined;
}

function assignSharedFileFacts(
  filePath: string,
  facts: CodeFact[],
  routeIds: Set<string>,
  routeById: Map<string, RouteScope>,
  index: Map<string, CodeFact[]>,
): void {
  const normalized = filePath.replace(/\\/g, "/");
  const isDataModuleFile =
    /\.(service|repository|repo)\.[jt]sx?$/i.test(normalized) ||
    /\/(services|repositories)\//i.test(normalized);

  // visudev-gapclose P0-2: shared leaves.service.ts is related to many routes —
  // still attach db-read/db-write so Execution can show LeaveRequest edges.
  if (routeIds.size > 1) {
    if (!isDataModuleFile) return;
    const dbFacts = facts.filter((f) =>
      f.kind === "db-read" || f.kind === "db-write"
    );
    if (dbFacts.length === 0) return;
    for (const routeId of routeIds) {
      const route = routeById.get(routeId);
      if (!route || filePath === route.filePath) continue;
      index.get(routeId)?.push(...dbFacts);
    }
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
