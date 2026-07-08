/** Builds and sanitizes VisuDevGraph for Blueprint document export. */

import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import type { RouteScope } from "../../dto/blueprint/route-scope.dto.ts";
import type { VisuDevGraph } from "../../dto/graph/visudev-graph.dto.ts";
import { buildVisuDevGraphFromFacts } from "../graph/fact-graph.mapper.ts";
import {
  capGraphForExport,
  MAX_BLUEPRINT_FACTS,
} from "../internal/export-sanitizer.ts";

export function assembleBlueprintGraph(
  facts: CodeFact[],
  routeScopes: RouteScope[],
): VisuDevGraph {
  const graphFacts = facts.slice(0, MAX_BLUEPRINT_FACTS);
  return capGraphForExport(buildVisuDevGraphFromFacts(graphFacts, routeScopes));
}
