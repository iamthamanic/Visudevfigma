/**
 * Snippet heuristics for tenant/owner/role/unscoped-DB signals in evidence.
 */

import type { SoftwareGraphEvidence } from "../../../../shared/software-graph.types.js";

export const TENANT_RE = /\b(tenant[_-]?id|org[_-]?id|workspace[_-]?id|account[_-]?id)\b/i;
export const OWNER_RE = /\b(owner[_-]?id|user[_-]?id|created[_-]?by|author[_-]?id)\b/i;
export const ROLE_RE = /\b(role|permission|authorize|rbac|hasRole|requireRole)\b/i;
export const UNSCOPED_DB_RE =
  /\.(find(?:One|Many)?|findUnique|findFirst|findMany|query|select)\s*\(\s*\{\s*\}\s*\)|\.find\(\s*\{\s*\}\s*\)|SELECT\s+\*\s+FROM\s+\w+\s*;?/i;

export interface ChainSignals {
  hasTenant: boolean;
  hasOwner: boolean;
  hasRole: boolean;
  hasUnscopedDb: boolean;
  blob: string;
}

/** Index evidence once by nodeId — O(E) instead of filtering per node. */
export function indexEvidenceByNode(
  evidence: SoftwareGraphEvidence[],
): Map<string, SoftwareGraphEvidence[]> {
  const map = new Map<string, SoftwareGraphEvidence[]>();
  for (const item of evidence) {
    if (!item.nodeId) continue;
    const list = map.get(item.nodeId) ?? [];
    list.push(item);
    map.set(item.nodeId, list);
  }
  return map;
}

export function collectChainEvidence(
  nodeIds: Set<string>,
  byNode: Map<string, SoftwareGraphEvidence[]>,
): SoftwareGraphEvidence[] {
  const out: SoftwareGraphEvidence[] = [];
  for (const id of nodeIds) {
    const items = byNode.get(id);
    if (items) out.push(...items);
  }
  return out;
}

export function detectChainSignals(evidence: SoftwareGraphEvidence[]): ChainSignals {
  const blob = evidence.map((e) => `${e.kind}\n${e.excerpt}`).join("\n");
  return {
    blob,
    hasTenant: TENANT_RE.test(blob),
    hasOwner: OWNER_RE.test(blob),
    hasRole: ROLE_RE.test(blob),
    hasUnscopedDb: UNSCOPED_DB_RE.test(blob),
  };
}

export function filterEvidence(
  evidence: SoftwareGraphEvidence[],
  predicate: (e: SoftwareGraphEvidence) => boolean,
): SoftwareGraphEvidence[] {
  return evidence.filter(predicate).slice(0, 8);
}
