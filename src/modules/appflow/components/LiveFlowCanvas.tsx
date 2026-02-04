/**
 * LiveFlowCanvas – App Flow as one view: nodes = live preview iframes, edges = SVG paths.
 * Click on an edge animates a dot along that edge. Optional postMessage from preview app for auto-animation.
 * Location: src/modules/appflow/components/LiveFlowCanvas.tsx
 */

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import clsx from "clsx";
import { ZoomIn, ZoomOut, Home } from "lucide-react";
import type { Screen, Flow } from "../../../lib/visudev/types";
import { getScreenDepths, buildEdges, computePositions, type GraphEdge } from "../layout";
import styles from "../styles/LiveFlowCanvas.module.css";

const NODE_WIDTH = 320;
const NODE_HEIGHT = 240;
const HORIZONTAL_SPACING = 60;
const VERTICAL_SPACING = 40;
const ANIMATION_DURATION_MS = 400;

function normalizePreviewUrl(base: string, screenPath: string): string {
  const trimmed = (base || "").trim();
  if (!trimmed || (!trimmed.startsWith("http://") && !trimmed.startsWith("https://"))) return "";
  const path = (screenPath || "/").trim();
  const safePath =
    path.startsWith("/") && !path.includes("//") && !path.toLowerCase().includes("javascript:")
      ? path
      : path.startsWith("/")
        ? path
        : `/${path}`;
  const baseClean = trimmed.replace(/\/$/, "");
  return `${baseClean}${safePath}`;
}

interface LiveFlowCanvasProps {
  screens: Screen[];
  flows: Flow[];
  previewUrl: string;
  projectId?: string;
}

export function LiveFlowCanvas({ screens, flows, previewUrl }: LiveFlowCanvasProps) {
  const [zoom, setZoom] = useState(0.6);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [animatingEdge, setAnimatingEdge] = useState<GraphEdge | null>(null);
  const [dotPosition, setDotPosition] = useState<{ x: number; y: number } | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<HTMLDivElement>(null);
  const pathRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const animFrameRef = useRef<number | null>(null);
  const iframeToScreenRef = useRef<Map<Window, string>>(new Map());

  const depths = useMemo(() => getScreenDepths(screens), [screens]);
  const positions = useMemo(
    () =>
      computePositions(
        screens,
        depths,
        NODE_WIDTH,
        NODE_HEIGHT,
        HORIZONTAL_SPACING,
        VERTICAL_SPACING,
      ),
    [screens, depths],
  );
  const edges = useMemo(() => buildEdges(screens, flows), [screens, flows]);

  useEffect(() => {
    if (!graphRef.current) return;
    graphRef.current.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`;
  }, [pan, zoom]);

  const runEdgeAnimation = useCallback((edge: GraphEdge) => {
    const key = `${edge.fromId}-${edge.toId}`;
    const pathEl = pathRefs.current.get(key);
    if (!pathEl) {
      setAnimatingEdge(null);
      setDotPosition(null);
      return;
    }
    const totalLength = pathEl.getTotalLength();
    const start = performance.now();
    const tick = () => {
      const elapsed = performance.now() - start;
      const progress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
      const point = pathEl.getPointAtLength(progress * totalLength);
      setDotPosition({ x: point.x, y: point.y });
      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(tick);
      } else {
        setAnimatingEdge(null);
        setDotPosition(null);
        animFrameRef.current = null;
      }
    };
    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  useEffect(() => {
    if (animatingEdge) {
      runEdgeAnimation(animatingEdge);
    }
    return () => {
      if (animFrameRef.current != null) {
        cancelAnimationFrame(animFrameRef.current);
        animFrameRef.current = null;
      }
    };
  }, [animatingEdge, runEdgeAnimation]);

  const handleEdgeClick = useCallback((edge: GraphEdge) => {
    setAnimatingEdge(edge);
    setDotPosition(null);
  }, []);

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

  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 1.5));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.25));
  const handleZoomReset = () => {
    setZoom(0.6);
    setPan({ x: 40, y: 40 });
  };

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data;
      if (!data || data.type !== "visudev-navigate" || typeof data.path !== "string") return;
      const targetPath = data.path;
      const targetScreen = screens.find(
        (s) => s.path === targetPath || (targetPath && s.path.includes(targetPath)),
      );
      if (!targetScreen) return;
      const sourceScreenId = iframeToScreenRef.current.get(event.source as Window);
      if (!sourceScreenId) return;
      const edge = edges.find((e) => e.fromId === sourceScreenId && e.toId === targetScreen.id);
      if (edge) setAnimatingEdge(edge);
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [screens, edges]);

  if (screens.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>Keine Screens für Live Flow</p>
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
        <span className={styles.hint}>Klick auf eine Kante: Punkt animiert den Flow</span>
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
          {/* SVG layer: edges (behind nodes) */}
          <svg className={styles.svgLayer} width={maxX} height={maxY} aria-hidden="true">
            <defs>
              <marker
                id="live-arrow-nav"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <polygon className={styles.arrowNav} points="0 0, 8 4, 0 8" />
              </marker>
              <marker
                id="live-arrow-call"
                markerWidth="8"
                markerHeight="8"
                refX="7"
                refY="4"
                orient="auto"
              >
                <polygon className={styles.arrowCall} points="0 0, 8 4, 0 8" />
              </marker>
            </defs>
            {edges.map((edge, i) => {
              const fromPos = positions.get(edge.fromId);
              const toPos = positions.get(edge.toId);
              if (!fromPos || !toPos) return null;
              const x1 = fromPos.x + NODE_WIDTH;
              const y1 = fromPos.y + NODE_HEIGHT / 2;
              const x2 = toPos.x;
              const y2 = toPos.y + NODE_HEIGHT / 2;
              const cpx = (x1 + x2) / 2;
              const pathD = `M ${x1} ${y1} C ${cpx} ${y1}, ${cpx} ${y2}, ${x2} ${y2}`;
              const edgeKey = `${edge.fromId}-${edge.toId}`;
              return (
                <path
                  key={`${edge.fromId}-${edge.toId}-${i}`}
                  id={edgeKey}
                  d={pathD}
                  className={edge.type === "navigate" ? styles.edgeNav : styles.edgeCall}
                  markerEnd={
                    edge.type === "navigate" ? "url(#live-arrow-nav)" : "url(#live-arrow-call)"
                  }
                />
              );
            })}
            {dotPosition && (
              <circle className={styles.dot} r={8} cx={dotPosition.x} cy={dotPosition.y} />
            )}
          </svg>

          {/* Clickable invisible paths for edge hit area */}
          <svg className={styles.svgHit} width={maxX} height={maxY} aria-hidden="true">
            {edges.map((edge, i) => {
              const fromPos = positions.get(edge.fromId);
              const toPos = positions.get(edge.toId);
              if (!fromPos || !toPos) return null;
              const x1 = fromPos.x + NODE_WIDTH;
              const y1 = fromPos.y + NODE_HEIGHT / 2;
              const x2 = toPos.x;
              const y2 = toPos.y + NODE_HEIGHT / 2;
              const cpx = (x1 + x2) / 2;
              const pathD = `M ${x1} ${y1} C ${cpx} ${y1}, ${cpx} ${y2}, ${x2} ${y2}`;
              const edgeKey = `${edge.fromId}-${edge.toId}`;
              return (
                <path
                  key={`hit-${edge.fromId}-${edge.toId}-${i}`}
                  ref={(el) => {
                    if (el) pathRefs.current.set(edgeKey, el);
                  }}
                  d={pathD}
                  className={styles.edgeHit}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdgeClick(edge);
                  }}
                />
              );
            })}
          </svg>

          {/* Node layer: iframes */}
          <div
            className={styles.nodesLayer}
            ref={(el) => {
              if (el) {
                el.style.width = `${maxX}px`;
                el.style.height = `${maxY}px`;
              }
            }}
          >
            {screens.map((screen) => {
              const pos = positions.get(screen.id);
              if (!pos) return null;
              const iframeSrc = normalizePreviewUrl(previewUrl, screen.path || "/");
              return (
                <div
                  key={screen.id}
                  className={styles.nodeCard}
                  ref={(el) => {
                    if (el) {
                      el.style.left = `${pos.x}px`;
                      el.style.top = `${pos.y}px`;
                      el.style.width = `${NODE_WIDTH}px`;
                      el.style.height = `${NODE_HEIGHT}px`;
                    }
                  }}
                >
                  <div className={styles.nodeLabel}>
                    {screen.name}
                    {screen.path ? ` · ${screen.path}` : ""}
                  </div>
                  {iframeSrc ? (
                    <iframe
                      src={iframeSrc}
                      title={`Live: ${screen.name}`}
                      className={styles.nodeIframe}
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                      ref={(el) => {
                        if (el?.contentWindow)
                          iframeToScreenRef.current.set(el.contentWindow, screen.id);
                      }}
                    />
                  ) : (
                    <div className={styles.nodePlaceholder}>Keine URL</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
