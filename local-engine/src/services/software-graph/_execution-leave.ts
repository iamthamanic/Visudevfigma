/**
 * Leave/LeaveRequest wiring for execution paths (module-scoped).
 * Location: local-engine/src/services/software-graph/_execution-leave.ts
 */

import { createId } from "./_ids.js";
import { addEdge, type GraphBuilderState } from "./_state.js";

function isLeaveSurface(text: string): boolean {
  const normalized = String(text || "")
    .toLowerCase()
    .replace(/\\/g, "/");
  return (
    normalized.includes("/leaves/") ||
    normalized.includes("/leave/") ||
    /(?:^|\/)leaves?(?:\/|\.|$)/.test(normalized) ||
    /\/api\/leaves?(?:\/|$)/.test(normalized)
  );
}

function isLeaveTableLabel(label: string): boolean {
  const normalized = String(label || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return normalized === "leaverequest" || normalized.endsWith("leaverequest");
}

function leaveModulePrefix(filePath: string): string | null {
  const normalized = String(filePath || "")
    .toLowerCase()
    .replace(/\\/g, "/");
  const match = normalized.match(/^(.*\/leaves?)(?=\/|$)/);
  return match?.[1] ?? null;
}

export { isLeaveSurface };

export function leaveRouteRank(routeNode: {
  label: string;
  filePath?: string;
  metadata: Record<string, unknown>;
}): number {
  const path = typeof routeNode.metadata.path === "string" ? routeNode.metadata.path : "";
  const surface = `${routeNode.label} ${routeNode.filePath ?? ""} ${path}`;
  return isLeaveSurface(surface) ? 0 : 1;
}

export interface LeaveTableRef {
  id: string;
  modulePrefix: string | null;
}

export function collectLeaveTableRefs(state: GraphBuilderState): LeaveTableRef[] {
  const refs: LeaveTableRef[] = [];
  for (const node of state.nodes.values()) {
    if (node.kind !== "table" || !isLeaveTableLabel(node.label)) continue;
    refs.push({
      id: node.id,
      modulePrefix: node.filePath ? leaveModulePrefix(node.filePath) : null,
    });
  }
  return refs;
}

function routeModulePrefix(routeNode: {
  filePath?: string;
  metadata: Record<string, unknown>;
}): string | null {
  if (routeNode.filePath) {
    const fromFile = leaveModulePrefix(routeNode.filePath);
    if (fromFile) return fromFile;
  }
  const path = typeof routeNode.metadata.path === "string" ? routeNode.metadata.path : "";
  return leaveModulePrefix(path);
}

function tablesForRoute(
  routeNode: { filePath?: string; metadata: Record<string, unknown> },
  leaveTables: readonly LeaveTableRef[],
): LeaveTableRef[] {
  const prefix = routeModulePrefix(routeNode);
  if (prefix) {
    const sameModule = leaveTables.filter((table) => table.modulePrefix === prefix);
    if (sameModule.length > 0) return sameModule;
  }
  // Prisma schema models live under schema.prisma (no /leaves/ path). Still wire
  // them to leave routes so Execution can reach ≥3 steps with DB (P2-2).
  return leaveTables.filter((table) => table.modulePrefix === null);
}

/** Ensure leave route files have data edges only to same-module LeaveRequest tables. */
export function ensureLeaveRouteDataEdges(
  state: GraphBuilderState,
  leaveTables: readonly LeaveTableRef[],
): void {
  if (leaveTables.length === 0) return;

  for (const routeNode of state.nodes.values()) {
    if (routeNode.kind !== "route") continue;
    const path = typeof routeNode.metadata.path === "string" ? routeNode.metadata.path : "";
    const surface = `${routeNode.label} ${routeNode.filePath ?? ""} ${path}`;
    if (!isLeaveSurface(surface)) continue;
    const fileId =
      typeof routeNode.scopeId === "string" && routeNode.scopeId.length > 0
        ? routeNode.scopeId
        : undefined;
    if (!fileId || !state.nodes.has(fileId)) continue;

    for (const table of tablesForRoute(routeNode, leaveTables)) {
      addEdge(state, {
        id: createId("edge", fileId, table.id, "data", "leave"),
        kind: "data",
        sourceId: fileId,
        targetId: table.id,
        metadata: { reason: "leave-route-db-fact" },
      });
    }
  }
}

export function appendLeaveRequestTables(
  routeNode: { label: string; filePath?: string; metadata: Record<string, unknown> },
  leaveTables: readonly LeaveTableRef[],
  steps: string[],
  visited: Set<string>,
): void {
  const path = typeof routeNode.metadata.path === "string" ? routeNode.metadata.path : "";
  const surface = `${routeNode.label} ${routeNode.filePath ?? ""} ${path}`;
  if (!isLeaveSurface(surface)) return;

  for (const table of tablesForRoute(routeNode, leaveTables)) {
    if (visited.has(table.id)) continue;
    visited.add(table.id);
    if (!steps.includes(table.id)) steps.push(table.id);
  }
}
