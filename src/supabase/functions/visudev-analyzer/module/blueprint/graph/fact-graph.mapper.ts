/** Maps CodeFacts (+ optional RouteScopes) into VisuDevGraph v0.1. */

import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import type { VisuDevGraph } from "../../dto/graph/visudev-graph.dto.ts";
import type { RouteScope } from "../../dto/blueprint/route-scope.dto.ts";
import {
  assembleVisuDevGraph,
  createGraphBuildContext,
} from "./fact-graph.context.ts";
import {
  buildEvidenceIndex,
  finalizeOrphanEvidence,
} from "./fact-graph-evidence.ts";
import { buildScopedGraph } from "./fact-graph.scoped.ts";
import { mapUnscopedFacts } from "./fact-graph.unscoped.ts";
import {
  validateCodeFactForMapping,
  validateCodeFactShape,
} from "./fact-graph.validate.ts";
import { validateRouteScopes } from "./route-scope.validate.ts";

export function buildVisuDevGraphFromFacts(
  facts: CodeFact[],
  routeScopes: RouteScope[] = [],
): VisuDevGraph {
  const inputFacts = Array.isArray(facts) ? facts : [];
  const shapeValidFacts = inputFacts.filter((fact): fact is CodeFact =>
    validateCodeFactShape(fact as CodeFact)
  );
  const rejectedCount = inputFacts.length - shapeValidFacts.length;
  if (rejectedCount > 0) {
    console.warn(
      `[visudev-graph] buildVisuDevGraphFromFacts: rejected ${rejectedCount} fact(s) with invalid shape before mapping`,
    );
  }
  const mappableFacts = shapeValidFacts.filter((fact) =>
    validateCodeFactForMapping(fact)
  );
  const safeScopes = Array.isArray(routeScopes) ? routeScopes : [];
  const validatedScopes = validateRouteScopes(safeScopes);
  const evidence = buildEvidenceIndex(shapeValidFacts);
  const graphContext = createGraphBuildContext(evidence);

  if (validatedScopes.length === 0) {
    mapUnscopedFacts(
      mappableFacts,
      evidence,
      graphContext.nodes,
      graphContext.edges,
      graphContext.nodeById,
      graphContext.edgeById,
      graphContext.idRegistry,
      graphContext.tableByLabel,
      graphContext.idStemCounters,
    );
  } else {
    buildScopedGraph(mappableFacts, validatedScopes, graphContext);
  }

  finalizeOrphanEvidence(evidence);
  return assembleVisuDevGraph(graphContext);
}
