/**
 * LiveFlowCanvas – App Flow as one view: nodes = live preview iframes, edges = SVG paths.
 * Click on an edge animates a dot along that edge. Optional postMessage from preview app for auto-animation.
 * Location: src/modules/appflow/components/LiveFlowCanvas.tsx
 */

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import clsx from "clsx";
import type { Screen, Flow } from "../../../lib/visudev/types";
import type { PreviewStepLog } from "../../../utils/api";
import type { NodeViewportMode, VisudevDomReport } from "../types";
import {
  getScreenDepths,
  buildEdges,
  computePositions,
  matchScreenPath,
  normalizeRoutePath,
  normalizePreviewUrl,
  type GraphEdge,
} from "../layout";
import { useScreenLoadState, SCREEN_FAIL_REASONS } from "../hooks/useScreenLoadState";
import { usePreviewPostMessage } from "../hooks/usePreviewPostMessage";
import { FlowNodeCard } from "./FlowNodeCard";
import { CanvasToolbar } from "./CanvasToolbar";
import { FlowEdgesLayer } from "./FlowEdgesLayer";
import { PreviewTerminal } from "./PreviewTerminal";
import styles from "../styles/LiveFlowCanvas.module.css";

export { SCREEN_FAIL_REASONS };

const NODE_WIDTH = 320;
const NODE_HEIGHT = 240;
const HORIZONTAL_SPACING = 60;
const VERTICAL_SPACING = 40;
const ANIMATION_DURATION_MS = 400;
const INITIAL_ZOOM = 0.6;
const INITIAL_PAN = { x: 40, y: 40 };
const AUTH_ROUTE_PATTERN =
  /^\/(?:login|signin|sign-in|auth|register|forgot-password|reset-password)(?:\/|$)/i;

interface FocusedScreen {
  id: string;
  name: string;
  iframeSrc: string;
}

function dedupeEdges(edges: GraphEdge[]): GraphEdge[] {
  const byPair = new Map<string, GraphEdge>();
  edges.forEach((edge) => {
    const key = `${edge.fromId}->${edge.toId}`;
    const existing = byPair.get(key);
    if (!existing || (existing.type === "call" && edge.type === "navigate")) {
      byPair.set(key, edge);
    }
  });
  return Array.from(byPair.values());
}

function isAuthRoute(path: string): boolean {
  return AUTH_ROUTE_PATTERN.test(normalizeRoutePath(path || "/"));
}

interface LiveFlowCanvasProps {
  screens: Screen[];
  flows: Flow[];
  previewUrl: string;
  projectId?: string;
  /** Exakte Fehlermeldung vom Preview/Build (Runner); wird als erste Zeile im Terminal angezeigt. */
  previewError?: string | null;
  /** „Preview aktualisieren“ läuft – im Terminal einen Eintrag mit Spinner anzeigen. */
  refreshInProgress?: boolean;
  /** Log-Einträge vom Preview-Start/Refresh (Runner/Edge). */
  refreshLogs?: PreviewStepLog[];
}

export function LiveFlowCanvas({
  screens,
  flows,
  previewUrl,
  previewError,
  refreshInProgress = false,
  refreshLogs = [],
}: LiveFlowCanvasProps) {
  const [zoom, setZoom] = useState(INITIAL_ZOOM);
  const [pan, setPan] = useState(INITIAL_PAN);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [viewportMode, setViewportMode] = useState<NodeViewportMode>("fit-desktop");
  const [animatingEdge, setAnimatingEdge] = useState<GraphEdge | null>(null);
  const [dotPosition, setDotPosition] = useState<{ x: number; y: number } | null>(null);
  const [runtimeEdges, setRuntimeEdges] = useState<GraphEdge[]>([]);
  const [focusedScreen, setFocusedScreen] = useState<FocusedScreen | null>(null);
  /** Last visudev-dom-report per screen id (from iframe postMessage). */
  const [domReportsByScreenId, setDomReportsByScreenId] = useState<
    Record<string, VisudevDomReport>
  >({});
  const [showTerminal, setShowTerminal] = useState(false);

  const { screenLoadState, screenFailReason, loadLogs, markScreenLoaded, markScreenFailed } =
    useScreenLoadState(screens, previewUrl, previewError);

  const canvasRef = useRef<HTMLDivElement>(null);
  const terminalScrollRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<HTMLDivElement>(null);
  const nodesLayerRef = useRef<HTMLDivElement>(null);
  const progressTrackRef = useRef<HTMLDivElement>(null);
  const pathRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const animFrameRef = useRef<number | null>(null);
  const iframeToScreenRef = useRef<Map<Window, string>>(new Map());

  const screenSignature = useMemo(
    () =>
      screens
        .map((s) => `${s.id}|${s.path || "/"}|${s.name}`)
        .sort()
        .join("||"),
    [screens],
  );

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
  const staticEdges = useMemo(() => dedupeEdges(buildEdges(screens, flows)), [screens, flows]);
  const edges = useMemo(
    () => dedupeEdges([...staticEdges, ...runtimeEdges]),
    [staticEdges, runtimeEdges],
  );

  useEffect(() => {
    pathRefs.current.clear();
  }, [edges]);

  useEffect(() => {
    setRuntimeEdges([]);
    setDomReportsByScreenId({});
    iframeToScreenRef.current.clear();
  }, [screenSignature, previewUrl]);

  useEffect(() => {
    if (!graphRef.current) return;
    graphRef.current.style.setProperty("--graph-translate-x", `${pan.x}px`);
    graphRef.current.style.setProperty("--graph-translate-y", `${pan.y}px`);
    graphRef.current.style.setProperty("--graph-scale", String(zoom));
  }, [pan, zoom]);

  useEffect(() => {
    if (showTerminal && terminalScrollRef.current) {
      terminalScrollRef.current.scrollTop = terminalScrollRef.current.scrollHeight;
    }
  }, [showTerminal, loadLogs, refreshLogs, refreshInProgress]);

  const maxX = screens.length
    ? Math.max(...Array.from(positions.values()).map((p) => p.x), 0) + NODE_WIDTH + 80
    : 0;
  const maxY = screens.length
    ? Math.max(...Array.from(positions.values()).map((p) => p.y), 0) + NODE_HEIGHT + 80
    : 0;

  const screensWithUrl = screens.filter((s) => normalizePreviewUrl(previewUrl, s.path || "/"));
  const totalWithUrl = screensWithUrl.length;
  const loadedCount = screensWithUrl.filter((s) => screenLoadState[s.id] === "loaded").length;
  const progressPercent = totalWithUrl > 0 ? Math.round((loadedCount / totalWithUrl) * 100) : 100;

  useEffect(() => {
    if (!nodesLayerRef.current) return;
    nodesLayerRef.current.style.setProperty("--nodes-layer-width", `${maxX}px`);
    nodesLayerRef.current.style.setProperty("--nodes-layer-height", `${maxY}px`);
  }, [maxX, maxY]);

  useEffect(() => {
    if (!progressTrackRef.current) return;
    progressTrackRef.current.style.setProperty("--progress-percent", `${progressPercent}%`);
  }, [progressPercent]);

  useEffect(() => {
    setRuntimeEdges((prev) => {
      const existingKeys = new Set(prev.map((edge) => `${edge.fromId}->${edge.toId}`));
      const additions: GraphEdge[] = [];
      screens.forEach((screen) => {
        const report = domReportsByScreenId[screen.id];
        if (!report?.route) return;
        const targetScreen = screens.find((s) => matchScreenPath(s.path || "/", report.route));
        if (!targetScreen || targetScreen.id === screen.id) return;
        const key = `${screen.id}->${targetScreen.id}`;
        if (existingKeys.has(key)) return;
        existingKeys.add(key);
        additions.push({ fromId: screen.id, toId: targetScreen.id, type: "navigate" });
      });
      return additions.length > 0 ? [...prev, ...additions] : prev;
    });
  }, [domReportsByScreenId, screens]);

  const authRouteByScreenId = useMemo(() => {
    const map = new Map<string, string>();
    screens.forEach((screen) => {
      const report = domReportsByScreenId[screen.id];
      if (!report?.route) return;
      const actualRoute = normalizeRoutePath(report.route);
      const expectedPath = normalizeRoutePath(screen.path || "/");
      if (isAuthRoute(expectedPath)) return;
      if (isAuthRoute(actualRoute) && !matchScreenPath(screen.path || "/", actualRoute)) {
        map.set(screen.id, actualRoute);
      }
    });
    return map;
  }, [domReportsByScreenId, screens]);

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

  const isInteractiveTarget = (target: EventTarget | null): boolean => {
    if (!(target instanceof HTMLElement)) return false;
    return Boolean(
      target.closest(
        "[data-node-card='true'], iframe, button, a, input, select, textarea, label, [role='button']",
      ),
    );
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      if (isInteractiveTarget(e.target)) return;
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
    setZoom(INITIAL_ZOOM);
    setPan(INITIAL_PAN);
  };

  /** Trackpad/Mausrad-Zoom: Pinch (ctrl+wheel) oder zwei Finger scrollen auf dem Canvas. */
  const handleWheel = useCallback((e: React.WheelEvent) => {
    const isPinch = e.ctrlKey || e.metaKey;
    const isOverCanvas = canvasRef.current?.contains(e.target as Node);
    if (isPinch || isOverCanvas) {
      e.preventDefault();
      const delta = -e.deltaY * (isPinch ? 0.002 : 0.0015);
      setZoom((z) => Math.min(Math.max(z + delta, 0.25), 1.5));
    }
  }, []);

  const handleRuntimeNavigate = useCallback(
    (sourceScreenId: string, targetPath: string): GraphEdge | null => {
      const targetScreen = screens.find((s) => matchScreenPath(s.path || "/", targetPath));
      if (!targetScreen || targetScreen.id === sourceScreenId) return null;
      const existing = edges.find(
        (edge) => edge.fromId === sourceScreenId && edge.toId === targetScreen.id,
      );
      if (existing) return existing;
      const runtimeEdge: GraphEdge = {
        fromId: sourceScreenId,
        toId: targetScreen.id,
        type: "navigate",
      };
      setRuntimeEdges((prev) => {
        const hasEdge = prev.some(
          (edge) => edge.fromId === runtimeEdge.fromId && edge.toId === runtimeEdge.toId,
        );
        return hasEdge ? prev : [...prev, runtimeEdge];
      });
      requestAnimationFrame(() => setAnimatingEdge(runtimeEdge));
      return null;
    },
    [edges, screens],
  );

  useEffect(() => {
    if (!focusedScreen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFocusedScreen(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [focusedScreen]);

  usePreviewPostMessage(
    iframeToScreenRef,
    screens,
    edges,
    markScreenFailed,
    setDomReportsByScreenId,
    setAnimatingEdge,
    handleRuntimeNavigate,
  );

  if (screens.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyText}>Keine Screens für Live Flow</p>
      </div>
    );
  }

  const loadingCount = screensWithUrl.filter((s) => screenLoadState[s.id] === "loading").length;
  const showProgress = totalWithUrl > 0 && (loadingCount > 0 || loadedCount < totalWithUrl);

  return (
    <div className={styles.root}>
      <CanvasToolbar
        showProgress={showProgress}
        progressTrackRef={progressTrackRef}
        loadedCount={loadedCount}
        totalWithUrl={totalWithUrl}
        progressPercent={progressPercent}
        zoom={zoom}
        onZoomOut={handleZoomOut}
        onZoomIn={handleZoomIn}
        onZoomReset={handleZoomReset}
        viewportMode={viewportMode}
        onViewportModeChange={setViewportMode}
        showTerminal={showTerminal}
        onToggleTerminal={() => setShowTerminal((v) => !v)}
      />

      {showTerminal && (
        <PreviewTerminal
          ref={terminalScrollRef}
          refreshLogs={refreshLogs}
          loadLogs={loadLogs}
          refreshInProgress={refreshInProgress}
        />
      )}

      <div
        ref={canvasRef}
        className={clsx(styles.canvas, isDragging && styles.canvasDragging)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div ref={graphRef} className={styles.graph}>
          {/* Nodes zuerst (unten), Kanten per z-index darüber – so sind Verbindungen sichtbar */}
          <div className={styles.nodesLayer} ref={nodesLayerRef}>
            {screens.map((screen) => {
              const pos = positions.get(screen.id);
              if (!pos) return null;
              const iframeSrc = normalizePreviewUrl(previewUrl, screen.path || "/");
              return (
                <FlowNodeCard
                  key={screen.id}
                  screen={screen}
                  pos={pos}
                  iframeSrc={iframeSrc}
                  loadState={screenLoadState[screen.id] ?? "loading"}
                  failReason={screenFailReason[screen.id]}
                  domReport={domReportsByScreenId[screen.id]}
                  viewportMode={viewportMode}
                  authRequired={authRouteByScreenId.has(screen.id)}
                  authRoute={authRouteByScreenId.get(screen.id)}
                  onFocus={(screenId, screenName, iframeSrc) =>
                    setFocusedScreen({ id: screenId, name: screenName, iframeSrc })
                  }
                  onLoad={() => markScreenLoaded(screen.id, screen.name)}
                  onError={(reason, name, url) => markScreenFailed(screen.id, reason, name, url)}
                  registerIframe={(win, screenId) => iframeToScreenRef.current.set(win, screenId)}
                  nodeWidth={NODE_WIDTH}
                  nodeHeight={NODE_HEIGHT}
                />
              );
            })}
          </div>

          <FlowEdgesLayer
            edges={edges}
            positions={positions}
            maxX={maxX}
            maxY={maxY}
            pathRefs={pathRefs}
            dotPosition={dotPosition}
            onEdgeClick={handleEdgeClick}
          />
        </div>
      </div>

      {focusedScreen && (
        <div
          className={styles.focusBackdrop}
          role="presentation"
          onClick={() => setFocusedScreen(null)}
        >
          <div
            className={styles.focusPanel}
            role="dialog"
            aria-modal="true"
            aria-label={`Fokus: ${focusedScreen.name}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.focusHeader}>
              <span className={styles.focusTitle}>{focusedScreen.name}</span>
              <button
                type="button"
                className={styles.focusCloseBtn}
                onClick={() => setFocusedScreen(null)}
              >
                Schließen
              </button>
            </div>
            <div className={styles.focusBody}>
              <iframe
                src={focusedScreen.iframeSrc}
                title={`Fokus: ${focusedScreen.name}`}
                className={styles.focusIframe}
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                onLoad={() => markScreenLoaded(focusedScreen.id, focusedScreen.name)}
                onError={() =>
                  markScreenFailed(
                    focusedScreen.id,
                    SCREEN_FAIL_REASONS.LOAD_ERROR,
                    focusedScreen.name,
                    focusedScreen.iframeSrc,
                  )
                }
                ref={(el) => {
                  if (el?.contentWindow) {
                    iframeToScreenRef.current.set(el.contentWindow, focusedScreen.id);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
