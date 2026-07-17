/**
 * Adds fact evidence and inferred nodes/edges to the graph state.
 */

import type { RawBlueprintFact } from "../../types/api.types.js";
import { classifyFactKind } from "./_classification.js";
import { createId, stableUniqueId } from "./_ids.js";
import { isPrismaSchemaModelFact, prismaTableNodeId } from "./_prisma-models.js";
import { sanitizeExcerpt, sanitizeMetadata } from "./_sanitize.js";
import { addEdge, addNode, type GraphBuilderState } from "./_state.js";

export function addFactEvidence(
  fact: RawBlueprintFact,
  fileId: string,
  state: GraphBuilderState,
): void {
  const evId = stableUniqueId(state.registry, "evidence", createId("ev", fact.id));
  state.evidence.push({
    id: evId,
    factId: fact.id,
    kind: fact.kind,
    filePath: fact.filePath,
    line: fact.line,
    excerpt: sanitizeExcerpt(fact.snippet),
  });

  const classification = classifyFactKind(fact.kind);
  if (!classification.nodeKind) return;

  const tableLabel =
    typeof fact.metadata?.table === "string" && fact.metadata.table.trim()
      ? fact.metadata.table.trim()
      : null;
  const pathLabel =
    typeof fact.metadata?.path === "string" && fact.metadata.path.trim()
      ? String(fact.metadata.method ?? "ALL") + " " + fact.metadata.path.trim()
      : null;
  const inferredLabel = tableLabel ?? pathLabel ?? fact.kind;

  // Prisma schema models share a stable table id so LeaveRequest survives route floods.
  const inferredNodeId = stableUniqueId(
    state.registry,
    "node",
    tableLabel && isPrismaSchemaModelFact(fact)
      ? prismaTableNodeId(tableLabel)
      : createId("inferred", fact.kind, fact.id),
  );
  addNode(state, {
    id: inferredNodeId,
    kind: classification.nodeKind,
    label: inferredLabel,
    scopeId: fileId,
    filePath: fact.filePath,
    line: fact.line,
    metadata: sanitizeMetadata(fact.metadata ?? {}),
  });

  addEdge(state, {
    id: stableUniqueId(state.registry, "edge", createId("edge", fileId, inferredNodeId)),
    kind: "contains",
    sourceId: fileId,
    targetId: inferredNodeId,
    metadata: {},
  });

  if (classification.edgeKind) {
    addEdge(state, {
      id: stableUniqueId(
        state.registry,
        "edge",
        createId("edge", fileId, inferredNodeId, classification.edgeKind),
      ),
      kind: classification.edgeKind,
      sourceId: fileId,
      targetId: inferredNodeId,
      metadata: { evidenceFactId: fact.id },
    });
  }
}
