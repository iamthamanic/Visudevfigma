/**
 * Graph neighborhood walk for application-chain analysis.
 */

import type {
  SoftwareGraphEdge,
  SoftwareGraphNode,
} from "../../../../shared/software-graph.types.js";

export const CHAIN_EDGE_KINDS = new Set([
  "authenticates",
  "validates",
  "calls",
  "api",
  "data",
  "implements",
  "imports",
]);

export const MAX_CHAIN_DEPTH = 24;

export interface ReachableChain {
  nodeIds: Set<string>;
  edgeKinds: Set<string>;
  nodesByKind: Map<string, SoftwareGraphNode[]>;
  /** True when BFS stopped because depth limit was hit with remaining work. */
  truncated: boolean;
}

export function buildOutgoing(edges: SoftwareGraphEdge[]): Map<string, SoftwareGraphEdge[]> {
  const map = new Map<string, SoftwareGraphEdge[]>();
  for (const edge of edges) {
    if (!CHAIN_EDGE_KINDS.has(edge.kind)) continue;
    const list = map.get(edge.sourceId) ?? [];
    list.push(edge);
    map.set(edge.sourceId, list);
  }
  return map;
}

/**
 * BFS from one or more seed nodes (route + owning file). File seeds matter because
 * authenticates/validates/data edges are attached to file nodes, not route nodes.
 */
export function collectReachable(
  seedIds: string | string[],
  outgoing: Map<string, SoftwareGraphEdge[]>,
  nodes: Map<string, SoftwareGraphNode>,
  maxDepth = MAX_CHAIN_DEPTH,
): ReachableChain {
  const start = (Array.isArray(seedIds) ? seedIds : [seedIds]).filter((id) => nodes.has(id));
  const nodeIds = new Set<string>(start);
  const edgeKinds = new Set<string>();
  const nodesByKind = new Map<string, SoftwareGraphNode[]>();
  const queue = [...start];
  let head = 0;
  let depth = 0;
  let truncated = false;

  for (const id of start) {
    const node = nodes.get(id);
    if (!node) continue;
    const bucket = nodesByKind.get(node.kind) ?? [];
    if (!bucket.some((n) => n.id === id)) {
      bucket.push(node);
      nodesByKind.set(node.kind, bucket);
    }
  }

  while (head < queue.length) {
    if (depth >= maxDepth) {
      truncated = true;
      break;
    }
    const size = queue.length;
    while (head < size) {
      const sourceId = queue[head++];
      for (const edge of outgoing.get(sourceId) ?? []) {
        edgeKinds.add(edge.kind);
        if (nodeIds.has(edge.targetId)) continue;
        const target = nodes.get(edge.targetId);
        if (!target) continue;
        nodeIds.add(edge.targetId);
        queue.push(edge.targetId);
        const bucket = nodesByKind.get(target.kind) ?? [];
        bucket.push(target);
        nodesByKind.set(target.kind, bucket);
      }
    }
    depth += 1;
  }

  return { nodeIds, edgeKinds, nodesByKind, truncated };
}

/** Route node id plus owning file node(s) — matches how the graph builder attaches edges. */
export function resolveRouteChainSeeds(
  route: SoftwareGraphNode,
  nodes: Map<string, SoftwareGraphNode>,
): string[] {
  const seeds = new Set<string>([route.id]);
  if (typeof route.scopeId === "string" && nodes.has(route.scopeId)) {
    seeds.add(route.scopeId);
  }
  if (route.filePath) {
    for (const node of nodes.values()) {
      if (node.kind === "file" && node.filePath === route.filePath) {
        seeds.add(node.id);
      }
    }
  }
  return [...seeds];
}
