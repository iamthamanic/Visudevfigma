/** Unscoped fallback mapping when no RouteScope[] is available. */

import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import type {
  VisuDevEdge,
  VisuDevNode,
} from "../../dto/graph/visudev-graph.dto.ts";
import { type EvidenceIndex } from "./fact-graph-evidence.ts";
import { validateCodeFactForMapping } from "./fact-graph.validate.ts";
import {
  applyFactToUnscopedRoute,
  beginUnscopedRoute,
  type UnscopedRouteContext,
} from "./fact-graph.unscoped-session.ts";

export function mapUnscopedFacts(
  facts: CodeFact[],
  evidence: EvidenceIndex,
  nodes: VisuDevNode[],
  edges: VisuDevEdge[],
  nodeById: Map<string, VisuDevNode>,
  edgeById: Map<string, VisuDevEdge>,
  idRegistry: Set<string>,
  tableByLabel: Map<string, string>,
  idStemCounters: Map<string, number>,
): void {
  const orderedFacts = [...facts].sort((left, right) => {
    if (left.filePath !== right.filePath) {
      return left.filePath.localeCompare(right.filePath);
    }
    return left.line - right.line;
  });

  let activeContext: UnscopedRouteContext | undefined;
  let activeFilePath: string | undefined;

  for (const fact of orderedFacts) {
    if (!validateCodeFactForMapping(fact)) continue;

    if (fact.filePath !== activeFilePath) {
      activeFilePath = fact.filePath;
      activeContext = undefined;
    }

    const evidenceId = evidence.idForFact(fact);

    if (fact.kind === "api-route") {
      const started = beginUnscopedRoute(
        fact,
        evidence,
        evidenceId,
        nodes,
        edges,
        nodeById,
        edgeById,
        idRegistry,
        tableByLabel,
        idStemCounters,
      );
      if (started) activeContext = started;
      continue;
    }

    if (!activeContext) continue;

    applyFactToUnscopedRoute(
      fact,
      evidenceId,
      evidence,
      activeContext,
      nodes,
      edges,
      nodeById,
      edgeById,
      idRegistry,
      tableByLabel,
      idStemCounters,
    );
  }
}
