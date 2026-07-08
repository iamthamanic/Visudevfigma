/** DB read/write mapping rules for VisuDevGraph. */

import type { CodeFact } from "../../dto/blueprint/blueprint-document.dto.ts";
import type { VisuDevEdgeKind } from "../../dto/graph/visudev-graph.dto.ts";
import type { FactDispatchContext } from "./fact-graph.dispatch-context.ts";
import { linkEvidence } from "./fact-graph-evidence.ts";
import {
  attachEvidence,
  ensureEdge,
  ensureTableNode,
} from "./fact-graph.nodes.ts";
import { validateTableFact } from "./fact-graph.validate.ts";

export function mapDbFact(
  ctx: FactDispatchContext,
  fact: CodeFact,
  evidenceId: string,
  tableNodeId: string,
): void {
  const tableMeta = validateTableFact(fact);
  if (!tableMeta) return;
  const { table } = tableMeta;
  ensureTableNode(
    ctx.nodes,
    ctx.nodeById,
    table,
    tableNodeId,
    ctx.route.id,
    fact,
  );
  ctx.scopeNodeIds.add(tableNodeId);

  const edgeKind: VisuDevEdgeKind = fact.kind === "db-read"
    ? "reads"
    : "writes";
  const edgeId = `edge-${ctx.routeNodeId}-${edgeKind}-${tableNodeId}`;
  const edge = ensureEdge(
    ctx.edges,
    ctx.edgeById,
    edgeId,
    ctx.routeNodeId,
    tableNodeId,
    edgeKind,
    ctx.route.id,
    fact,
    evidenceId,
  );
  ctx.scopeEdgeIds.add(edge.id);
  linkEvidence(ctx.evidence, evidenceId, "edge", edge.id);
  attachEvidence(ctx.nodeById.get(tableNodeId), evidenceId);
}
