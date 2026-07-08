/** Collision-safe export identifier remapping for VisuDevGraph references. */

import { sanitizeExportIdentifier } from "./evidence-sanitizer.ts";

const MAX_REMAP_ATTEMPTS = 100;

export class ExportIdRegistry {
  private readonly idMap = new Map<string, string>();
  private readonly usedByMaxLen = new Map<number, Set<string>>();

  remap(rawId: string, maxLen: number): string {
    const cacheKey = `${maxLen}:${rawId}`;
    const cached = this.idMap.get(cacheKey);
    if (cached) return cached;

    const used = this.usedValues(maxLen);
    let candidate = sanitizeExportIdentifier(rawId, maxLen);
    let attempt = 1;
    while (used.has(candidate)) {
      if (attempt > MAX_REMAP_ATTEMPTS) {
        candidate = sanitizeExportIdentifier(`id-${used.size + 1}`, maxLen);
        break;
      }
      const suffixToken = `~${attempt}`;
      const prefix = rawId.slice(0, Math.max(1, maxLen - suffixToken.length));
      candidate = sanitizeExportIdentifier(`${prefix}${suffixToken}`, maxLen);
      attempt += 1;
    }

    used.add(candidate);
    this.idMap.set(cacheKey, candidate);
    return candidate;
  }

  private usedValues(maxLen: number): Set<string> {
    const existing = this.usedByMaxLen.get(maxLen);
    if (existing) return existing;
    const next = new Set<string>();
    this.usedByMaxLen.set(maxLen, next);
    return next;
  }
}

export function registerGraphIds(
  graph: {
    nodes: Array<{ id: string; scopeId?: string; evidenceIds: string[] }>;
    edges: Array<{
      id: string;
      fromNodeId: string;
      toNodeId: string;
      scopeId?: string;
      evidenceIds: string[];
    }>;
    scopes: Array<{ id: string; nodeIds: string[]; edgeIds: string[] }>;
    evidence: Array<{ id: string; subjectType: string; subjectId: string }>;
  },
  registry: ExportIdRegistry,
): void {
  for (const node of graph.nodes) {
    registry.remap(node.id, 80);
    if (node.scopeId) registry.remap(node.scopeId, 120);
    for (const evidenceId of node.evidenceIds) registry.remap(evidenceId, 80);
  }
  for (const edge of graph.edges) {
    registry.remap(edge.id, 80);
    registry.remap(edge.fromNodeId, 80);
    registry.remap(edge.toNodeId, 80);
    if (edge.scopeId) registry.remap(edge.scopeId, 120);
    for (const evidenceId of edge.evidenceIds) registry.remap(evidenceId, 80);
  }
  for (const scope of graph.scopes) {
    registry.remap(scope.id, 120);
    for (const nodeId of scope.nodeIds) registry.remap(nodeId, 80);
    for (const edgeId of scope.edgeIds) registry.remap(edgeId, 80);
  }
  for (const item of graph.evidence) {
    registry.remap(item.id, 80);
    const subjectMaxLen = item.subjectType === "scope" ? 120 : 80;
    registry.remap(item.subjectId, subjectMaxLen);
  }
}
