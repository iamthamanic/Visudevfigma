/** Dispatches validated CodeFacts to VisuDevGraph mapping handlers. */

import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import { mapControlEdge, mapRateLimitFact } from "./fact-graph.controls.ts";
import { mapDbFact } from "./fact-graph.db.ts";
import { type FactDispatchContext } from "./fact-graph.dispatch-context.ts";
import { linkEvidence } from "./fact-graph-evidence.ts";
import { mapExternalFact } from "./fact-graph.external.ts";
import { resolveTableNodeId } from "./fact-graph.index.ts";
import { attachEvidence } from "./fact-graph.nodes.ts";
import {
  validateCodeFactForMapping,
  validateTableFact,
} from "./fact-graph.validate.ts";

const VALIDATION_FACT_KINDS = new Set([
  "schema-safe-parse",
  "schema-parse",
  "validation-deny-400",
]);

const AUTH_FACT_KINDS = new Set(["auth-check", "auth-deny-401"]);

export function dispatchFactToScope(
  fact: CodeFact,
  evidenceId: string,
  ctx: FactDispatchContext,
): void {
  if (!validateCodeFactForMapping(fact)) return;

  switch (fact.kind) {
    case "api-route":
      linkEvidence(ctx.evidence, evidenceId, "node", ctx.routeNodeId);
      attachEvidence(ctx.nodeById.get(ctx.routeNodeId), evidenceId);
      return;
    case "db-read":
    case "db-write": {
      const { table } = validateTableFact(fact) ?? { table: null };
      if (!table) return;
      const tableNodeId = resolveTableNodeId(
        table,
        ctx.tableByLabel,
        ctx.idRegistry,
        ctx.idStemCounters,
      );
      mapDbFact(ctx, fact, evidenceId, tableNodeId);
      return;
    }
    case "external-api-call":
      mapExternalFact(ctx, fact, evidenceId);
      return;
    case "rate-limit":
      mapRateLimitFact(ctx, fact, evidenceId);
      return;
    default:
      break;
  }

  if (VALIDATION_FACT_KINDS.has(fact.kind)) {
    if (!ctx.controlNodes.validationNodeId) return;
    mapControlEdge(
      ctx,
      fact,
      evidenceId,
      ctx.controlNodes.validationNodeId,
      "validates",
    );
    return;
  }

  if (AUTH_FACT_KINDS.has(fact.kind)) {
    if (!ctx.controlNodes.authNodeId) return;
    mapControlEdge(
      ctx,
      fact,
      evidenceId,
      ctx.controlNodes.authNodeId,
      "authenticates",
    );
  }
}
