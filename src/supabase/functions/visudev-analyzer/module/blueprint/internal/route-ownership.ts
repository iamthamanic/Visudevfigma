/** Route line ownership ranges derived from route order and observed fact lines. */

import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import type { RouteScope } from "../../dto/blueprint/route-scope.dto.ts";

const MAX_HANDLER_SPAN = 200;

export interface RouteLineRange {
  routeId: string;
  startLine: number;
  endLine: number;
}

export function buildSortedRoutesByFile(
  routeScopes: RouteScope[],
): Map<string, RouteScope[]> {
  const routesByFile = new Map<string, RouteScope[]>();
  for (const route of routeScopes) {
    const routesOnFile = routesByFile.get(route.filePath) ?? [];
    routesOnFile.push(route);
    routesByFile.set(route.filePath, routesOnFile);
  }
  for (const [filePath, routesOnFile] of routesByFile) {
    routesOnFile.sort((left, right) => left.line - right.line);
    routesByFile.set(filePath, routesOnFile);
  }
  return routesByFile;
}

export function buildMaxLineByFile(facts: CodeFact[]): Map<string, number> {
  const maxLineByFile = new Map<string, number>();
  for (const fact of facts) {
    if (!Number.isFinite(fact.line) || fact.line < 1) continue;
    const line = Math.floor(fact.line);
    const current = maxLineByFile.get(fact.filePath) ?? 0;
    maxLineByFile.set(fact.filePath, Math.max(current, line));
  }
  return maxLineByFile;
}

export function buildOwnershipRangesByFile(
  sortedRoutesByFile: Map<string, RouteScope[]>,
  maxLineByFile: Map<string, number> = new Map(),
): Map<string, RouteLineRange[]> {
  const ownershipRangesByFile = new Map<string, RouteLineRange[]>();
  for (const [filePath, routesOnFile] of sortedRoutesByFile) {
    const fileMaxLine = maxLineByFile.get(filePath) ??
      routesOnFile.at(-1)?.line ?? 1;
    const ranges = routesOnFile.map((route, routeIndex) => ({
      routeId: route.id,
      startLine: route.line,
      endLine: routesOnFile[routeIndex + 1]?.line ??
        (routesOnFile.length === 1
          ? fileMaxLine + 1
          : Math.min(route.line + MAX_HANDLER_SPAN, fileMaxLine + 1)),
    }));
    ownershipRangesByFile.set(filePath, ranges);
  }
  return ownershipRangesByFile;
}

export function resolveOwnerRouteId(
  filePath: string,
  line: number,
  ownershipRangesByFile: Map<string, RouteLineRange[]>,
): string | undefined {
  const ranges = ownershipRangesByFile.get(filePath);
  if (!ranges?.length) return undefined;

  let left = 0;
  let right = ranges.length - 1;
  let ownerIndex = 0;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (ranges[mid].startLine <= line) {
      ownerIndex = mid;
      left = mid + 1;
    } else {
      right = mid - 1;
    }
  }

  const owner = ranges[ownerIndex];
  if (line < owner.startLine) return undefined;
  if (line >= owner.endLine) return undefined;
  return owner.routeId;
}
