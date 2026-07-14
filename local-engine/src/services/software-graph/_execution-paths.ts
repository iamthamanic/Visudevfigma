/**
 * Derives ordered execution paths from route nodes by following call/API/data/auth edges.
 * Uses a pre-built adjacency index so path extraction stays O(edges) per route, not O(edges × steps).
 */

import type { SoftwareGraphGroup } from "../../../../shared/software-graph.types.js";
import type { GraphBuilderState } from "./_state.js";

const PRE_HANDLER_KINDS = ["authenticates", "validates"] as const;
const POST_HANDLER_KINDS = ["calls", "api", "data", "imports"] as const;
const MAX_PATH_DEPTH = 12;

export interface ExecutionPath {
  nodeIds: string[];
  cycleNodeId?: string;
}

type OutgoingIndex = Map<string, Map<string, string[]>>;

function readRouteFileId(routeNode: { scopeId?: string }): string | undefined {
  return typeof routeNode.scopeId === "string" && routeNode.scopeId.length > 0
    ? routeNode.scopeId
    : undefined;
}

function buildOutgoingIndex(state: GraphBuilderState): OutgoingIndex {
  const index: OutgoingIndex = new Map();
  for (const edge of state.edges.values()) {
    if (!state.nodes.has(edge.targetId)) continue;
    let byKind = index.get(edge.sourceId);
    if (!byKind) {
      byKind = new Map();
      index.set(edge.sourceId, byKind);
    }
    const targets = byKind.get(edge.kind) ?? [];
    targets.push(edge.targetId);
    byKind.set(edge.kind, targets);
  }
  return index;
}

function outgoingTargets(
  index: OutgoingIndex,
  sourceId: string,
  edgeKinds: readonly string[],
): string[] {
  const byKind = index.get(sourceId);
  if (!byKind) return [];
  const targets: string[] = [];
  for (const kind of edgeKinds) {
    const next = byKind.get(kind);
    if (next) targets.push(...next);
  }
  return targets;
}

function appendUnique(steps: string[], nodeId: string): boolean {
  if (steps.includes(nodeId)) return false;
  steps.push(nodeId);
  return true;
}

function buildPrimaryPath(
  routeNodeId: string,
  fileId: string,
  index: OutgoingIndex,
): ExecutionPath {
  const steps: string[] = [routeNodeId];
  let cycleNodeId: string | undefined;

  for (const targetId of outgoingTargets(index, fileId, PRE_HANDLER_KINDS)) {
    appendUnique(steps, targetId);
  }

  appendUnique(steps, fileId);

  const queue = [fileId];
  const visited = new Set<string>([routeNodeId, fileId]);
  let depth = 0;

  while (queue.length > 0 && depth < MAX_PATH_DEPTH) {
    const currentId = queue.shift();
    if (!currentId) break;
    depth += 1;

    for (const targetId of outgoingTargets(index, currentId, POST_HANDLER_KINDS)) {
      if (visited.has(targetId)) {
        cycleNodeId = targetId;
        continue;
      }
      visited.add(targetId);
      appendUnique(steps, targetId);
      queue.push(targetId);
    }
  }

  return cycleNodeId ? { nodeIds: steps, cycleNodeId } : { nodeIds: steps };
}

function applyExecutionPathMetadata(
  state: GraphBuilderState,
  routeNodeId: string,
  path: ExecutionPath,
): void {
  const storedNode = state.nodes.get(routeNodeId);
  if (!storedNode) return;
  storedNode.metadata.executionCycleNodeId = path.cycleNodeId ?? null;
}

export function attachExecutionPathGroups(state: GraphBuilderState): SoftwareGraphGroup[] {
  const groups: SoftwareGraphGroup[] = [];
  const index = buildOutgoingIndex(state);
  const routeNodes = [...state.nodes.values()].filter((node) => node.kind === "route");

  for (const routeNode of routeNodes) {
    const fileId = readRouteFileId(routeNode);
    const routeKey =
      typeof routeNode.metadata.routeId === "string" ? routeNode.metadata.routeId : routeNode.id;

    const path = fileId
      ? buildPrimaryPath(routeNode.id, fileId, index)
      : { nodeIds: [routeNode.id] };

    applyExecutionPathMetadata(state, routeNode.id, path);

    groups.push({
      id: `execution:${routeKey}:0`,
      kind: "route",
      label: `${routeNode.label} · path 1`,
      nodeIds: path.nodeIds,
    });
  }

  return groups;
}
