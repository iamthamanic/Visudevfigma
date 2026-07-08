/** Control and rate-limit mapping rules for VisuDevGraph. */

import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import type { FactDispatchContext } from "./fact-graph.dispatch-context.ts";
import { linkEvidence } from "./fact-graph-evidence.ts";
import {
  attachEvidence,
  ensureControlNode,
  ensureEdge,
} from "./fact-graph.nodes.ts";
import { createUniqueGraphId } from "./graph-id.util.ts";

export function mapControlEdge(
  ctx: FactDispatchContext,
  fact: CodeFact,
  evidenceId: string,
  controlNodeId: string,
  edgeKind: "validates" | "authenticates",
): void {
  const controlNode = ctx.nodeById.get(controlNodeId);
  if (controlNode) {
    controlNode.state = "confirmed";
    attachEvidence(controlNode, evidenceId);
  }
  const edgeId = `edge-${ctx.routeNodeId}-${edgeKind}-${controlNodeId}`;
  const edge = ensureEdge(
    ctx.edges,
    ctx.edgeById,
    edgeId,
    ctx.routeNodeId,
    controlNodeId,
    edgeKind,
    ctx.route.id,
    fact,
    evidenceId,
  );
  ctx.scopeNodeIds.add(controlNodeId);
  ctx.scopeEdgeIds.add(edge.id);
  linkEvidence(ctx.evidence, evidenceId, "edge", edge.id);
}

export function mapRateLimitFact(
  ctx: FactDispatchContext,
  fact: CodeFact,
  evidenceId: string,
): void {
  const rateLimitNodeId = createUniqueGraphId(
    "node-rate-limit",
    ctx.route.id,
    ctx.idRegistry,
    ctx.idStemCounters,
  );
  ensureControlNode(
    ctx.nodes,
    ctx.nodeById,
    rateLimitNodeId,
    "rate-limit",
    "Rate limit",
    ctx.route.id,
    fact.filePath,
    fact.line,
    "confirmed",
  );
  ctx.scopeNodeIds.add(rateLimitNodeId);
  const edgeId = `edge-${ctx.routeNodeId}-rate_limits-${rateLimitNodeId}`;
  const edge = ensureEdge(
    ctx.edges,
    ctx.edgeById,
    edgeId,
    ctx.routeNodeId,
    rateLimitNodeId,
    "rate_limits",
    ctx.route.id,
    fact,
    evidenceId,
  );
  ctx.scopeEdgeIds.add(edge.id);
  linkEvidence(ctx.evidence, evidenceId, "edge", edge.id);
  attachEvidence(ctx.nodeById.get(rateLimitNodeId), evidenceId);
}
