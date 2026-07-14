/**
 * Route and fact extraction from SoftwareGraph.
 */

import type { SoftwareGraph } from "./software-graph.types.js";
import type { ProjectedCodeFact, ProjectedRoute } from "./blueprint-graph-types.js";

export function normalizeRouteMethod(method: unknown): string {
  const HTTP_METHODS = new Set([
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "HEAD",
    "OPTIONS",
    "PAGE",
  ]);
  const raw = typeof method === "string" ? method.trim().toUpperCase() : "";
  return HTTP_METHODS.has(raw) ? raw : "PAGE";
}

export function normalizeRoutePath(path: unknown): string {
  if (typeof path !== "string") return "/";
  const trimmed = path.trim();
  if (!trimmed) return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

export function deriveFactsFromGraph(graph: SoftwareGraph): ProjectedCodeFact[] {
  return graph.evidence.map((evidence) => ({
    id: evidence.factId,
    kind: evidence.kind,
    filePath: evidence.filePath,
    line: evidence.line,
    snippet: evidence.excerpt,
    metadata: {},
  }));
}

export function deriveRoutesFromGraph(graph: SoftwareGraph): ProjectedRoute[] {
  const routes: ProjectedRoute[] = [];
  for (const node of graph.nodes) {
    if (node.kind !== "route") continue;
    if (!node.filePath || node.line == null) continue;
    const routeId =
      typeof node.metadata.routeId === "string" && node.metadata.routeId.length > 0
        ? node.metadata.routeId
        : node.id;
    routes.push({
      id: routeId,
      method: normalizeRouteMethod(node.metadata.method),
      path: normalizeRoutePath(node.metadata.path),
      filePath: node.filePath,
      line: node.line,
      pipeline: [],
      concepts: {},
    });
  }
  return routes;
}
