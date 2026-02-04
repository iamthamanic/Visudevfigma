/**
 * Shared layout and edge logic for App Flow graph (FlowGraphView, LiveFlowCanvas).
 * Location: src/modules/appflow/layout.ts
 */

import type { Screen, Flow } from "../../lib/visudev/types";

export interface NodePosition {
  x: number;
  y: number;
  depth: number;
}

export interface GraphEdge {
  fromId: string;
  toId: string;
  type: "navigate" | "call";
}

export function getScreenDepths(screens: Screen[]): Map<string, number> {
  const depths = new Map<string, number>();
  const visited = new Set<string>();

  const rootScreens = screens.filter(
    (s) =>
      s.path === "/" ||
      s.path === "/home" ||
      s.path === "/login" ||
      s.path === "/index" ||
      s.name.toLowerCase().includes("home") ||
      s.name.toLowerCase().includes("index"),
  );
  const queue: Array<{ screen: Screen; depth: number }> = (
    rootScreens.length > 0 ? rootScreens : [screens[0]].filter(Boolean)
  ).map((s) => ({
    screen: s,
    depth: 0,
  }));

  while (queue.length > 0) {
    const { screen, depth } = queue.shift()!;
    if (!screen || visited.has(screen.id)) continue;
    visited.add(screen.id);
    depths.set(screen.id, depth);
    (screen.navigatesTo || []).forEach((targetPath) => {
      const target = screens.find(
        (s) => s.path === targetPath || (targetPath && s.path.includes(targetPath)),
      );
      if (target && !visited.has(target.id)) queue.push({ screen: target, depth: depth + 1 });
    });
  }
  screens.forEach((s) => {
    if (!depths.has(s.id)) depths.set(s.id, 0);
  });
  return depths;
}

export function buildEdges(screens: Screen[], flows: Flow[]): GraphEdge[] {
  const edges: GraphEdge[] = [];
  const flowToScreen = new Map<string, string>();
  screens.forEach((s) => {
    (s.flows || []).forEach((fid) => flowToScreen.set(fid, s.id));
  });
  const flowByNameOrId = new Map<string, Flow>();
  flows.forEach((f) => {
    flowByNameOrId.set(f.id, f);
    flowByNameOrId.set(f.name, f);
  });

  screens.forEach((source) => {
    (source.navigatesTo || []).forEach((targetPath) => {
      const target = screens.find(
        (s) => s.path === targetPath || (targetPath && s.path.includes(targetPath)),
      );
      if (target && target.id !== source.id)
        edges.push({ fromId: source.id, toId: target.id, type: "navigate" });
    });
  });

  flows.forEach((flow) => {
    const fromScreenId = flowToScreen.get(flow.id);
    if (!fromScreenId) return;
    (flow.calls || []).forEach((callTarget) => {
      const targetFlow = flowByNameOrId.get(callTarget);
      const toScreenId = targetFlow ? flowToScreen.get(targetFlow.id) : undefined;
      if (toScreenId && toScreenId !== fromScreenId)
        edges.push({ fromId: fromScreenId, toId: toScreenId, type: "call" });
    });
  });

  return edges;
}

export function computePositions(
  screens: Screen[],
  depths: Map<string, number>,
  nodeWidth: number,
  nodeHeight: number,
  hSpacing: number,
  vSpacing: number,
): Map<string, NodePosition> {
  const pos = new Map<string, NodePosition>();
  const columns: Screen[][] = [];
  screens.forEach((s) => {
    const d = depths.get(s.id) ?? 0;
    if (!columns[d]) columns[d] = [];
    columns[d].push(s);
  });
  let x = 0;
  columns.forEach((col) => {
    if (!col?.length) return;
    col.sort((a, b) => a.name.localeCompare(b.name));
    let y = 0;
    col.forEach((s) => {
      pos.set(s.id, { x, y, depth: depths.get(s.id) ?? 0 });
      y += nodeHeight + vSpacing;
    });
    x += nodeWidth + hSpacing;
  });
  return pos;
}
