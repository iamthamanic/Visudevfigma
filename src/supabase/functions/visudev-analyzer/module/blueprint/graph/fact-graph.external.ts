/** External API mapping rules for VisuDevGraph. */

import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import type { FactDispatchContext } from "./fact-graph.dispatch-context.ts";
import { linkEvidence } from "./fact-graph-evidence.ts";
import {
  attachEvidence,
  ensureEdge,
  ensureExternalNode,
} from "./fact-graph.nodes.ts";
import { createUniqueGraphId } from "./graph-id.util.ts";

export function mapExternalFact(
  ctx: FactDispatchContext,
  fact: CodeFact,
  evidenceId: string,
): void {
  const externalNodeId = createUniqueGraphId(
    "node-external",
    `${ctx.route.id}-${fact.line}`,
    ctx.idRegistry,
    ctx.idStemCounters,
  );
  ensureExternalNode(
    ctx.nodes,
    ctx.nodeById,
    externalNodeId,
    ctx.route.id,
    fact,
  );
  ctx.scopeNodeIds.add(externalNodeId);
  const edgeId = `edge-${ctx.routeNodeId}-calls-${externalNodeId}`;
  const edge = ensureEdge(
    ctx.edges,
    ctx.edgeById,
    edgeId,
    ctx.routeNodeId,
    externalNodeId,
    "calls",
    ctx.route.id,
    fact,
    evidenceId,
  );
  ctx.scopeEdgeIds.add(edge.id);
  linkEvidence(ctx.evidence, evidenceId, "edge", edge.id);
  attachEvidence(ctx.nodeById.get(externalNodeId), evidenceId);
}
