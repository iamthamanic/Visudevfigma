/**
 * Orchestrates SoftwareGraph normalization from untrusted Blueprint KV payloads.
 */

import type { SoftwareGraph, SoftwareGraphEdge, SoftwareGraphNode } from "./software-graph-types";
import {
  boundedArray,
  boundedString,
  isIsoTimestamp,
  isRecord,
  isSoftwareGraphEdge,
  isSoftwareGraphNode,
  MAX_EDGES,
  MAX_NODES,
} from "./normalize-graph-guards";
import { sanitizeEdge, sanitizeNode } from "./normalize-graph-sanitize";

export function normalizeSoftwareGraph(raw: unknown): SoftwareGraph | undefined {
  if (!isRecord(raw)) return undefined;
  if (raw.version != null && raw.version !== 1) return undefined;
  if (!Array.isArray(raw.nodes) || !Array.isArray(raw.edges)) return undefined;

  const rawNodeList = boundedArray(raw.nodes, MAX_NODES, isSoftwareGraphNode);
  const nodes: SoftwareGraphNode[] = [];
  const seenNodeIds = new Set<string>();

  for (const rawNode of rawNodeList) {
    const node = sanitizeNode(rawNode);
    if (!node || seenNodeIds.has(node.id)) continue;
    seenNodeIds.add(node.id);
    nodes.push(node);
  }

  const nodeIds = new Set(nodes.map((node) => node.id));
  const rawEdgeList = boundedArray(raw.edges, MAX_EDGES, isSoftwareGraphEdge);
  const edges: SoftwareGraphEdge[] = [];
  const seenEdgeIds = new Set<string>();

  for (const rawEdge of rawEdgeList) {
    const edge = sanitizeEdge(rawEdge);
    if (!edge) continue;
    if (!nodeIds.has(edge.sourceId) || !nodeIds.has(edge.targetId)) continue;
    if (nodeIds.has(edge.id) || seenEdgeIds.has(edge.id)) continue;
    seenEdgeIds.add(edge.id);
    edges.push(edge);
  }

  if (nodes.length === 0 && edges.length === 0) return undefined;

  const projectId = boundedString(raw.projectId);
  const analyzedAt = boundedString(raw.analyzedAt, 64);
  if (!projectId || !analyzedAt || !isIsoTimestamp(analyzedAt)) return undefined;

  return {
    version: 1,
    projectId,
    analyzedAt,
    scopes: [],
    nodes,
    edges,
    evidence: [],
    groups: [],
    metrics: [],
    condensed: false,
    limits: {
      maxNodes: MAX_NODES,
      maxEdges: MAX_EDGES,
    },
  };
}
