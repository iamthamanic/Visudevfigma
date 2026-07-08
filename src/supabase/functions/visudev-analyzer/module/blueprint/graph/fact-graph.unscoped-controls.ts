/** Control-node bootstrap for unscoped VisuDevGraph route sessions. */

import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import type { VisuDevNode } from "../../dto/graph/visudev-graph.dto.ts";
import { ensureControlNode } from "./fact-graph.nodes.ts";
import type { UnscopedRouteContext } from "./fact-graph.unscoped-session.ts";
import { createUniqueGraphId } from "./graph-id.util.ts";

const VALIDATION_FACT_KINDS = new Set([
  "schema-safe-parse",
  "schema-parse",
  "validation-deny-400",
]);

const AUTH_FACT_KINDS = new Set(["auth-check", "auth-deny-401"]);

export function ensureControlNodesForUnscopedFact(
  fact: CodeFact,
  context: UnscopedRouteContext,
  nodes: VisuDevNode[],
  nodeById: Map<string, VisuDevNode>,
  idRegistry: Set<string>,
  idStemCounters: Map<string, number>,
): void {
  if (VALIDATION_FACT_KINDS.has(fact.kind) && !context.validationNodeId) {
    context.validationNodeId = createUniqueGraphId(
      "node-validation",
      context.route.id,
      idRegistry,
      idStemCounters,
    );
    ensureControlNode(
      nodes,
      nodeById,
      context.validationNodeId,
      "validation",
      "Validation",
      context.route.id,
      context.route.filePath,
      context.route.line,
      "confirmed",
    );
    context.scopeNodeIds.add(context.validationNodeId);
  }
  if (AUTH_FACT_KINDS.has(fact.kind) && !context.authNodeId) {
    context.authNodeId = createUniqueGraphId(
      "node-auth",
      context.route.id,
      idRegistry,
      idStemCounters,
    );
    ensureControlNode(
      nodes,
      nodeById,
      context.authNodeId,
      "auth",
      "Auth",
      context.route.id,
      context.route.filePath,
      context.route.line,
      "confirmed",
    );
    context.scopeNodeIds.add(context.authNodeId);
  }
}
