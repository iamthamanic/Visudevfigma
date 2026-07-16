/**
 * Derives ordered execution paths from route nodes by following call/API/data/auth edges.
 * Uses a pre-built adjacency index so path extraction stays O(edges) per route, not O(edges × steps).
 */

import type { SoftwareGraphGroup } from "../../../../shared/software-graph.types.js";
import {
  appendLeaveRequestTables,
  collectLeaveTableRefs,
  ensureLeaveRouteDataEdges,
  isLeaveSurface,
  leaveRouteRank,
} from "./_execution-leave.js";
import type { GraphBuilderState } from "./_state.js";
import type { LeaveTableRef } from "./_execution-leave.js";

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

function appendModuleDataTargets(
  routeFileId: string,
  routeDir: string,
  dataTargetsByDir: Map<string, string[]>,
  steps: string[],
  visited: Set<string>,
  state: GraphBuilderState,
  allowParentDir: boolean,
): void {
  if (!routeDir) return;
  const dirsToScan = [routeDir];
  // Parent scan only for leave modules — avoids polluting unrelated routes under app/modules.
  if (allowParentDir) {
    const parent = dirnameOf(routeDir);
    if (parent && parent !== routeDir) dirsToScan.push(parent);
  }

  for (const dir of dirsToScan) {
    for (const tableId of dataTargetsByDir.get(dir) ?? []) {
      if (visited.has(tableId)) continue;
      const tableNode = state.nodes.get(tableId);
      if (!tableNode || tableNode.kind !== "table") continue;
      visited.add(tableId);
      appendUnique(steps, tableId);
    }
  }
  void routeFileId;
}

/** Precompute same-dir service/repository → table targets once per graph. */
function buildModuleDataTargetsByDir(
  state: GraphBuilderState,
  index: OutgoingIndex,
): Map<string, string[]> {
  const byDir = new Map<string, string[]>();
  for (const node of state.nodes.values()) {
    if (node.kind !== "file" || !node.filePath) continue;
    if (!isModuleDataFile(node.filePath) && !isLeaveSurface(node.filePath)) continue;
    const dir = dirnameOf(node.filePath);
    if (!dir) continue;
    const tables = outgoingTargets(index, node.id, ["data"]);
    if (tables.length === 0) continue;
    const existing = byDir.get(dir) ?? [];
    existing.push(...tables);
    byDir.set(dir, existing);
  }
  return byDir;
}

function buildPrimaryPath(
  routeNodeId: string,
  fileId: string,
  index: OutgoingIndex,
  state: GraphBuilderState,
  dataTargetsByDir: Map<string, string[]>,
  leaveTables: readonly LeaveTableRef[],
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

  const routeFile = state.nodes.get(fileId);
  const routeDir = routeFile?.filePath ? dirnameOf(routeFile.filePath) : "";
  const routeNode = state.nodes.get(routeNodeId);
  const allowParentDir = Boolean(
    routeNode &&
    isLeaveSurface(
      `${routeNode.label} ${routeNode.filePath ?? ""} ${
        typeof routeNode.metadata.path === "string" ? routeNode.metadata.path : ""
      }`,
    ),
  );
  appendModuleDataTargets(
    fileId,
    routeDir,
    dataTargetsByDir,
    steps,
    visited,
    state,
    allowParentDir,
  );

  if (routeNode) {
    appendLeaveRequestTables(routeNode, leaveTables, steps, visited);
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
  const leaveTables = collectLeaveTableRefs(state);
  ensureLeaveRouteDataEdges(state, leaveTables);
  const index = buildOutgoingIndex(state);
  const dataTargetsByDir = buildModuleDataTargetsByDir(state, index);
  const routeNodes = [...state.nodes.values()]
    .filter((node) => node.kind === "route")
    // Stable partition: leave first; non-leave keep insertion order.
    .sort((a, b) => leaveRouteRank(a) - leaveRouteRank(b));

  if (routeNodes.length === 0) {
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
      ? buildPrimaryPath(routeNode.id, fileId, index, state, dataTargetsByDir, leaveTables)
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
