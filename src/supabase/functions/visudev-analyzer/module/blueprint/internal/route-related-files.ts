/** Related-file index for route scope assignment. */

import type { RouteScope } from "../../dto/blueprint/route-scope.dto.ts";

export function buildRelatedRouteIdsByFile(
  routeScopes: RouteScope[],
): Map<string, Set<string>> {
  const relatedRouteIdsByFile = new Map<string, Set<string>>();
  for (const route of routeScopes) {
    for (const filePath of route.relatedFiles) {
      const routeIds = relatedRouteIdsByFile.get(filePath) ?? new Set<string>();
      routeIds.add(route.id);
      relatedRouteIdsByFile.set(filePath, routeIds);
    }
  }
  return relatedRouteIdsByFile;
}
