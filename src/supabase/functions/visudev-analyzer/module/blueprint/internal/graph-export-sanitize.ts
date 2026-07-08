/** Applies export sanitization passes to a coerced VisuDevGraph. */

import type {
  VisuDevEvidence,
  VisuDevGraph,
} from "../../dto/graph/visudev-graph.dto.ts";
import { sanitizeExportIdentifier } from "./evidence-sanitizer.ts";
import { sanitizeFactMetadataForExport } from "./fact-metadata-sanitizer.ts";
import { ExportIdRegistry, registerGraphIds } from "./graph-export-id-remap.ts";
import {
  sanitizeFilePathForExport,
  sanitizeNodeLabelForExport,
  sanitizeScopeLabelForExport,
} from "./graph-export-label-sanitize.ts";
import { sanitizeSnippetForExport } from "./snippet-sanitizer.ts";

function remapEvidenceSubjectId(
  item: VisuDevEvidence,
  registry: ExportIdRegistry,
): string {
  const maxLen = item.subjectType === "scope" ? 120 : 80;
  return registry.remap(item.subjectId, maxLen);
}

export function sanitizeGraphForExport(graph: VisuDevGraph): VisuDevGraph {
  const registry = new ExportIdRegistry();
  registerGraphIds(graph, registry);

  const evidence = graph.evidence.map((item) => ({
    ...item,
    id: registry.remap(item.id, 80),
    factId: sanitizeExportIdentifier(item.factId, 120),
    subjectId: remapEvidenceSubjectId(item, registry),
    filePath: sanitizeFilePathForExport(item.filePath),
    snippet: sanitizeSnippetForExport(item.snippet),
    summary: sanitizeExportIdentifier(item.summary, 120),
  }));

  const nodes = graph.nodes.map((node) => ({
    ...node,
    id: registry.remap(node.id, 80),
    label: sanitizeNodeLabelForExport(node),
    scopeId: node.scopeId ? registry.remap(node.scopeId, 120) : undefined,
    filePath: node.filePath
      ? sanitizeFilePathForExport(node.filePath)
      : undefined,
    evidenceIds: node.evidenceIds.map((id) => registry.remap(id, 80)),
    metadata: node.metadata
      ? sanitizeFactMetadataForExport(node.metadata)
      : undefined,
  }));

  const edges = graph.edges.map((edge) => ({
    ...edge,
    id: registry.remap(edge.id, 80),
    fromNodeId: registry.remap(edge.fromNodeId, 80),
    toNodeId: registry.remap(edge.toNodeId, 80),
    scopeId: edge.scopeId ? registry.remap(edge.scopeId, 120) : undefined,
    evidenceIds: edge.evidenceIds.map((id) => registry.remap(id, 80)),
    metadata: edge.metadata
      ? sanitizeFactMetadataForExport(edge.metadata)
      : undefined,
  }));

  const scopes = graph.scopes.map((scope) => ({
    ...scope,
    id: registry.remap(scope.id, 120),
    label: sanitizeScopeLabelForExport(scope.label),
    nodeIds: scope.nodeIds.map((id) => registry.remap(id, 80)),
    edgeIds: scope.edgeIds.map((id) => registry.remap(id, 80)),
    metadata: scope.metadata
      ? sanitizeFactMetadataForExport(scope.metadata)
      : undefined,
  }));

  return { ...graph, evidence, nodes, edges, scopes };
}
