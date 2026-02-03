/**
 * FlowGraphView – Graph-Visualisierung für Screens und Flows (Knoten = Screens, Kanten = navigatesTo + Flow-Calls).
 * Location: src/modules/appflow/components/FlowGraphView.tsx
 */

import { useRef, useState, useEffect, useMemo } from "react";
import clsx from "clsx";
import { ZoomIn, ZoomOut, Home } from "lucide-react";
import type { Screen, Flow } from "../../../lib/visudev/types";
import styles from "../styles/FlowGraphView.module.css";

const NODE_WIDTH = 160;
const NODE_HEIGHT = 72;
const HORIZONTAL_SPACING = 80;
const VERTICAL_SPACING = 48;

interface FlowGraphViewProps {
  screens: Screen[];
  flows: Flow[];
}

interface NodePosition {
  x: number;
  y: number;
  depth: number;
}

function getScreenDepths(screens: Screen[]): Map<string, number> {
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

function buildEdges(
  screens: Screen[],
  flows: Flow[],
): Array<{ fromId: string; toId: string; type: "navigate" | "call" }> {
  const edges: Array<{ fromId: string; toId: string; type: "navigate" | "call" }> = [];
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

export function FlowGraphView({ screens, flows }: FlowGraphViewProps) {
  const [zoom, setZoom] = useState(0.8);
  const [pan, setPan] = useState({ x: 60, y: 60 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<HTMLDivElement>(null);

  const depths = useMemo(() => getScreenDepths(screens), [screens]);
  const positions = useMemo(() => {
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
        y += NODE_HEIGHT + VERTICAL_SPACING;
      });
      x += NODE_WIDTH + HORIZONTAL_SPACING;
    });
    return pos;
  }, [screens, depths]);

  const edges = useMemo(() => buildEdges(screens, flows), [screens, flows]);

  useEffect(() => {
    if (!graphRef.current) return;
    graphRef.current.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
  }, [pan, zoom]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.15, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.25));
  const handleZoomReset = () => {
    setZoom(0.8);
    setPan({ x: 60, y: 60 });
  };

  if (screens.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>Keine Screens für Graph</p>
      </div>
    );
  }

  const maxX = Math.max(...Array.from(positions.values()).map((p) => p.x), 0) + NODE_WIDTH + 80;
  const maxY = Math.max(...Array.from(positions.values()).map((p) => p.y), 0) + NODE_HEIGHT + 80;

  return (
    <div className={styles.root}>
      <div className={styles.controls}>
        <button
          type="button"
          onClick={handleZoomOut}
          className={styles.zoomBtn}
          title="Verkleinern"
        >
          <ZoomOut className={styles.zoomIcon} aria-hidden="true" />
        </button>
        <span className={styles.zoomValue}>{Math.round(zoom * 100)}%</span>
        <button type="button" onClick={handleZoomIn} className={styles.zoomBtn} title="Vergrößern">
          <ZoomIn className={styles.zoomIcon} aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={handleZoomReset}
          className={styles.zoomBtn}
          title="Zurücksetzen"
        >
          <Home className={styles.zoomIcon} aria-hidden="true" />
        </button>
      </div>

      <div
        ref={canvasRef}
        className={clsx(styles.canvas, isDragging && styles.canvasDragging)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div ref={graphRef} className={styles.graph}>
          <svg className={styles.svg} width={maxX} height={maxY} aria-hidden="true">
            <defs>
              <marker
                id="arrow-navigate"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <polygon className={styles.arrowNav} points="0 0, 8 4, 0 8" />
              </marker>
              <marker
                id="arrow-call"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <polygon className={styles.arrowCall} points="0 0, 8 4, 0 8" />
              </marker>
            </defs>
            {edges.map(({ fromId, toId, type }, i) => {
              const fromPos = positions.get(fromId);
              const toPos = positions.get(toId);
              if (!fromPos || !toPos) return null;
              const x1 = fromPos.x + NODE_WIDTH;
              const y1 = fromPos.y + NODE_HEIGHT / 2;
              const x2 = toPos.x;
              const y2 = toPos.y + NODE_HEIGHT / 2;
              const cpx = (x1 + x2) / 2;
              const pathD = `M ${x1} ${y1} C ${cpx} ${y1}, ${cpx} ${y2}, ${x2} ${y2}`;
              return (
                <path
                  key={`${fromId}-${toId}-${i}`}
                  d={pathD}
                  className={type === "navigate" ? styles.edgeNav : styles.edgeCall}
                  markerEnd={type === "navigate" ? "url(#arrow-navigate)" : "url(#arrow-call)"}
                />
              );
            })}
            {screens.map((screen) => {
              const pos = positions.get(screen.id);
              if (!pos) return null;
              const flowCount = (screen.flows || []).length;
              return (
                <g key={screen.id}>
                  <rect
                    x={pos.x}
                    y={pos.y}
                    width={NODE_WIDTH}
                    height={NODE_HEIGHT}
                    className={styles.node}
                    rx={6}
                    ry={6}
                  />
                  <text
                    x={pos.x + NODE_WIDTH / 2}
                    y={pos.y + 22}
                    textAnchor="middle"
                    className={styles.nodeTitle}
                  >
                    {screen.name.length > 18 ? screen.name.slice(0, 17) + "…" : screen.name}
                  </text>
                  <text
                    x={pos.x + NODE_WIDTH / 2}
                    y={pos.y + 44}
                    textAnchor="middle"
                    className={styles.nodeMeta}
                  >
                    {screen.path || ""}
                  </text>
                  <text
                    x={pos.x + NODE_WIDTH / 2}
                    y={pos.y + 62}
                    textAnchor="middle"
                    className={styles.nodeMeta}
                  >
                    {flowCount} Flow{flowCount !== 1 ? "s" : ""}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );
}
