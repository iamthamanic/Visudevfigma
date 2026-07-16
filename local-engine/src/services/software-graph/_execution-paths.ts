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
  state: GraphBuilderState,
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

  // visudev-gapclose P0-3: pull DB tables from same-module service/repository files
  // when import/call chain does not yet reach them (browo leaves.service, Formbricks libs).
  appendModuleDataTargets(state, fileId, index, steps, visited);

  return cycleNodeId ? { nodeIds: steps, cycleNodeId } : { nodeIds: steps };
}

function dirnameOf(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const idx = normalized.lastIndexOf("/");
  return idx <= 0 ? "" : normalized.slice(0, idx);
}

function isModuleDataFile(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, "/");
  return (
    /\.(service|repository|repo)\.[jt]sx?$/i.test(normalized) ||
    /\/(lib|server|repositories|services)\//i.test(normalized)
  );
}

/**
 * Attach table nodes from data edges on sibling module files (same directory).
 * Keeps Execution DB contact >0 when Prisma lives in *.service.ts next to routes.
 */
function appendModuleDataTargets(
  state: GraphBuilderState,
  routeFileId: string,
  index: OutgoingIndex,
  steps: string[],
  visited: Set<string>,
): void {
  const routeFile = state.nodes.get(routeFileId);
  const routePath = routeFile?.filePath;
  if (!routePath) return;
  const routeDir = dirnameOf(routePath);
  if (!routeDir) return;

  for (const node of state.nodes.values()) {
    if (node.kind !== "file" || !node.filePath) continue;
    if (node.id === routeFileId) continue;
    if (dirnameOf(node.filePath) !== routeDir) continue;
    if (!isModuleDataFile(node.filePath)) continue;

    for (const tableId of outgoingTargets(index, node.id, ["data"])) {
      if (visited.has(tableId)) continue;
      const tableNode = state.nodes.get(tableId);
      if (!tableNode || tableNode.kind !== "table") continue;
      visited.add(tableId);
      appendUnique(steps, tableId);
    }
  }
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

  if (routeNodes.length === 0) {
    // Honest non-HTTP surface (Rocket.Chat Meteor) — do not pretend empty HTTP succeeded.
    const fallbackNodes = [...state.nodes.values()]
      .filter((node) => node.kind === "service" || node.kind === "file" || node.kind === "runtime")
      .slice(0, 8)
      .map((node) => node.id);
    groups.push({
      id: "execution:non-http:0",
      kind: "runtime",
      label: "Non-HTTP surface — keine HTTP-Routen extrahiert",
      nodeIds: fallbackNodes,
    });
    return groups;
  }

  for (const routeNode of routeNodes) {
    const fileId = readRouteFileId(routeNode);
    const routeKey =
      typeof routeNode.metadata.routeId === "string" ? routeNode.metadata.routeId : routeNode.id;

    const path = fileId
      ? buildPrimaryPath(routeNode.id, fileId, index, state)
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
