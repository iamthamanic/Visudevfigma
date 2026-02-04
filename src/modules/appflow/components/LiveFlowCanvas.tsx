/**
 * LiveFlowCanvas – App Flow as one view: nodes = live preview iframes, edges = SVG paths.
 * Click on an edge animates a dot along that edge. Optional postMessage from preview app for auto-animation.
 * Location: src/modules/appflow/components/LiveFlowCanvas.tsx
 */

import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import clsx from "clsx";
import { ZoomIn, ZoomOut, Home, Loader2, Terminal } from "lucide-react";
import type { Screen, Flow } from "../../../lib/visudev/types";
import { getScreenDepths, buildEdges, computePositions, type GraphEdge } from "../layout";
import styles from "../styles/LiveFlowCanvas.module.css";

const NODE_WIDTH = 320;
const NODE_HEIGHT = 240;
const HORIZONTAL_SPACING = 60;
const VERTICAL_SPACING = 40;
const ANIMATION_DURATION_MS = 400;
/** Timeout pro Screen-Iframe; danach wird der Screen als „nicht geladen“ mit Grund angezeigt. */
const SCREEN_LOAD_TIMEOUT_MS = 60_000;

/** Hinweis, wenn alle Screens vermutlich wegen Iframe-Blockierung fehlschlagen (einmal im Log anzeigen). */
const EMBEDDING_HINT =
  "Tipp: Wenn alle Screens mit Timeout fehlschlagen, blockiert die Preview-App vermutlich Iframe-Einbetten. " +
  "In der Preview-App (z. B. Vite/Express) X-Frame-Options entfernen oder CSP setzen: frame-ancestors 'self' http://localhost:5173 http://localhost:3000; " +
  "oder in vite.config.ts: server: { headers: { 'Content-Security-Policy': \"frame-ancestors 'self' *\" } }.";

/** Klar benannte Gründe, wenn ein Screen nicht geladen werden kann (damit sie gefixt werden können). */
export const SCREEN_FAIL_REASONS = {
  TIMEOUT:
    "Timeout (60 s). Wahrscheinliche Ursache: Preview-App blockiert Iframe-Einbetten (X-Frame-Options / CSP). In der Preview-App Einbetten erlauben (siehe Terminal-Log).",
  LOAD_ERROR:
    "Iframe-Ladefehler (onError). Mögliche Ursachen: Route existiert nicht (404), X-Frame-Options/CSP blockieren Einbetten, CORS, Netzwerkfehler oder ungültige URL.",
  NO_URL: "Keine URL: Basis-URL oder Screen-Pfad fehlt.",
} as const;

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

/** Payload sent by user app via postMessage for optional live DOM/route display. */
export interface VisudevDomReport {
  type: "visudev-dom-report";
  route: string;
  buttons?: { tagName: string; role?: string; label?: string }[];
  links?: { href: string; text?: string }[];
}

interface LiveFlowCanvasProps {
  screens: Screen[];
  flows: Flow[];
  previewUrl: string;
  projectId?: string;
  /** Exakte Fehlermeldung vom Preview/Build (Runner); wird als erste Zeile im Terminal angezeigt. */
  previewError?: string | null;
}

export function LiveFlowCanvas({ screens, flows, previewUrl, previewError }: LiveFlowCanvasProps) {
  const [zoom, setZoom] = useState(0.6);
  const [pan, setPan] = useState({ x: 40, y: 40 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [animatingEdge, setAnimatingEdge] = useState<GraphEdge | null>(null);
  const [dotPosition, setDotPosition] = useState<{ x: number; y: number } | null>(null);
  /** Last visudev-dom-report per screen id (from iframe postMessage). */
  const [domReportsByScreenId, setDomReportsByScreenId] = useState<
    Record<string, VisudevDomReport>
  >({});
  /** Pro Screen: loading | loaded | failed – damit ein fehlgeschlagener Screen die anderen nicht blockiert. */
  const [screenLoadState, setScreenLoadState] = useState<
    Record<string, "loading" | "loaded" | "failed">
  >({});
  /** Pro Screen: klarer Grund, wenn nicht geladen (damit gefixt werden kann). */
  const [screenFailReason, setScreenFailReason] = useState<Record<string, string>>({});
  /** Log-Ausgabe für Terminal-Panel: was passiert beim Laden der Screens. */
  const [loadLogs, setLoadLogs] = useState<
    Array<{ id: string; time: string; message: string; type?: "info" | "success" | "error" }>
  >([]);
  const [showTerminal, setShowTerminal] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);
  const terminalScrollRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<HTMLDivElement>(null);
  const nodesLayerRef = useRef<HTMLDivElement>(null);
  const progressTrackRef = useRef<HTMLDivElement>(null);
  const pathRefs = useRef<Map<string, SVGPathElement>>(new Map());
  const animFrameRef = useRef<number | null>(null);
  const iframeToScreenRef = useRef<Map<Window, string>>(new Map());
  const loadTimeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const embeddingHintLoggedRef = useRef(false);

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

  const markScreenLoaded = useCallback((screenId: string, screenName?: string) => {
    const t = loadTimeoutsRef.current.get(screenId);
    if (t) {
      clearTimeout(t);
      loadTimeoutsRef.current.delete(screenId);
    }
    const name = screenName ?? screenId;
    setLoadLogs((prev) => [
      ...prev,
      {
        id: `${screenId}-loaded-${Date.now()}`,
        time: new Date().toLocaleTimeString("de-DE"),
        message: `✓ ${name}: onLoad ausgelöst (Dokument geladen). Leere Karte? Dann blockiert die App Einbetten (X-Frame-Options/CSP) oder liefert leere Seite.`,
        type: "success" as const,
      },
    ]);
    setScreenLoadState((prev) =>
      prev[screenId] === "failed" ? prev : { ...prev, [screenId]: "loaded" },
    );
  }, []);

  const markScreenFailed = useCallback(
    (screenId: string, reason: string, screenName?: string, url?: string) => {
      const t = loadTimeoutsRef.current.get(screenId);
      if (t) {
        clearTimeout(t);
        loadTimeoutsRef.current.delete(screenId);
      }
      const name = screenName ?? screenId;
      const detail = url ? ` URL: ${url}` : "";
      setLoadLogs((prev) => [
        ...prev,
        {
          id: `${screenId}-failed-${Date.now()}`,
          time: new Date().toLocaleTimeString("de-DE"),
          message: `✗ ${name} fehlgeschlagen: ${reason}${detail}`,
          type: "error" as const,
        },
      ]);
      setScreenLoadState((prev) => ({ ...prev, [screenId]: "failed" }));
      setScreenFailReason((prev) => ({ ...prev, [screenId]: reason }));
    },
    [],
  );

  // Reset per-screen load state and start timeouts when previewUrl or screens change
  useEffect(() => {
    loadTimeoutsRef.current.forEach((t) => clearTimeout(t));
    loadTimeoutsRef.current.clear();
    embeddingHintLoggedRef.current = false;
    const initial: Record<string, "loading" | "loaded" | "failed"> = {};
    const reasons: Record<string, string> = {};
    const now = new Date().toLocaleTimeString("de-DE");
    const logEntries: Array<{
      id: string;
      time: string;
      message: string;
      type?: "info" | "success" | "error";
    }> = [];

    if (previewError && previewError.trim()) {
      logEntries.push({
        id: "preview-error",
        time: now,
        message: `Preview/Build fehlgeschlagen (exakte Fehlermeldung):\n${previewError.trim()}`,
        type: "error",
      });
    }

    const screensWithUrl = screens.filter((s) => normalizePreviewUrl(previewUrl, s.path || "/"));
    logEntries.push({
      id: "step-start",
      time: now,
      message: `Schritt 1: Starte Ladevorgang für ${screensWithUrl.length} Screen(s). Basis-URL: ${previewUrl}. Timeout pro Screen: ${SCREEN_LOAD_TIMEOUT_MS / 1000} s.`,
      type: "info",
    });

    screens.forEach((s) => {
      const src = normalizePreviewUrl(previewUrl, s.path || "/");
      if (!src) {
        initial[s.id] = "failed";
        reasons[s.id] = SCREEN_FAIL_REASONS.NO_URL;
        logEntries.push({
          id: `${s.id}-no-url`,
          time: new Date().toLocaleTimeString("de-DE"),
          message: `✗ ${s.name} (${s.path || "/"}): Keine URL – Basis-URL oder Screen-Pfad fehlt. Basis-URL war: ${previewUrl || "(leer)"}`,
          type: "error",
        });
      } else {
        initial[s.id] = "loading";
        logEntries.push({
          id: `${s.id}-start`,
          time: new Date().toLocaleTimeString("de-DE"),
          message: `Schritt 2: Iframe für "${s.name}" (Pfad: ${s.path || "/"}) eingebunden. URL: ${src}. Warte auf onLoad oder Timeout.`,
          type: "info",
        });
        const t = setTimeout(() => {
          setScreenLoadState((prev) => ({ ...prev, [s.id]: "failed" }));
          setScreenFailReason((prev) => ({ ...prev, [s.id]: SCREEN_FAIL_REASONS.TIMEOUT }));
          setLoadLogs((prev) => {
            const next = [
              ...prev,
              {
                id: `${s.id}-timeout-${Date.now()}`,
                time: new Date().toLocaleTimeString("de-DE"),
                message: `✗ ${s.name} fehlgeschlagen: Timeout nach ${SCREEN_LOAD_TIMEOUT_MS / 1000} s (onLoad wurde nicht ausgelöst). Exakte URL: ${src}`,
                type: "error" as const,
              },
            ];
            if (!embeddingHintLoggedRef.current) {
              embeddingHintLoggedRef.current = true;
              next.push({
                id: `embedding-hint-${Date.now()}`,
                time: new Date().toLocaleTimeString("de-DE"),
                message: EMBEDDING_HINT,
                type: "info",
              });
            }
            return next;
          });
          loadTimeoutsRef.current.delete(s.id);
        }, SCREEN_LOAD_TIMEOUT_MS);
        loadTimeoutsRef.current.set(s.id, t);
      }
    });
    setLoadLogs(logEntries);
    setScreenLoadState(initial);
    setScreenFailReason(reasons);
    return () => {
      loadTimeoutsRef.current.forEach((t) => clearTimeout(t));
      loadTimeoutsRef.current.clear();
    };
  }, [previewUrl, screens, previewError]);

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
  }, [showTerminal, loadLogs]);

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
      if (!data || typeof data !== "object") return;

      if (data.type === "visudev-dom-report") {
        const report = data as VisudevDomReport;
        if (typeof report.route !== "string") return;
        const sourceScreenId = iframeToScreenRef.current.get(event.source as Window);
        if (!sourceScreenId) return;
        setDomReportsByScreenId((prev) => ({ ...prev, [sourceScreenId]: report }));
        return;
      }

      if (data.type !== "visudev-navigate" || typeof data.path !== "string") return;
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

  const loadingCount = screensWithUrl.filter((s) => screenLoadState[s.id] === "loading").length;
  const showProgress = totalWithUrl > 0 && (loadingCount > 0 || loadedCount < totalWithUrl);

  return (
    <div className={styles.root}>
      <div className={styles.controls}>
        {showProgress && (
          <div className={styles.progressWrap} role="status" aria-live="polite">
            <div className={styles.progressBarTrack} ref={progressTrackRef}>
              <div className={styles.progressBarFill} />
            </div>
            <span className={styles.progressText}>
              Screens: {loadedCount}/{totalWithUrl} ({progressPercent} %)
            </span>
          </div>
        )}
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
        <button
          type="button"
          onClick={() => setShowTerminal((v) => !v)}
          className={clsx(styles.zoomBtn, showTerminal && styles.terminalBtnActive)}
          title={showTerminal ? "Terminal schließen" : "Terminal: Lade-Logs anzeigen"}
          aria-expanded={showTerminal}
        >
          <Terminal className={styles.zoomIcon} aria-hidden="true" />
        </button>
        <span className={styles.hint}>
          Klick auf eine Kante: Punkt animiert den Flow. Leere Karten? App erlaubt ggf. kein
          Einbetten (X-Frame-Options) oder die Route lädt langsam.
        </span>
      </div>

      {showTerminal && (
        <div className={styles.terminalPanel} role="region" aria-label="Lade-Logs">
          <div className={styles.terminalHeader}>
            <Terminal className={styles.terminalHeaderIcon} aria-hidden="true" />
            <span>Lade-Logs – was passiert beim Anzeigen der Screens</span>
          </div>
          <div ref={terminalScrollRef} className={styles.terminalBody} tabIndex={0}>
            {loadLogs.length === 0 ? (
              <div className={styles.terminalLine}>Keine Einträge. Screens werden geladen …</div>
            ) : (
              loadLogs.map((entry) => (
                <div
                  key={entry.id}
                  className={clsx(
                    styles.terminalLine,
                    entry.type === "success" && styles.terminalLineSuccess,
                    entry.type === "error" && styles.terminalLineError,
                  )}
                >
                  <span className={styles.terminalTime}>[{entry.time}]</span> {entry.message}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <div
        ref={canvasRef}
        className={clsx(styles.canvas, isDragging && styles.canvasDragging)}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div ref={graphRef} className={styles.graph}>
          {/* Nodes zuerst (unten), Kanten per z-index darüber – so sind Verbindungen sichtbar */}
          <div className={styles.nodesLayer} ref={nodesLayerRef}>
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
                      el.style.setProperty("--node-left", `${pos.x}px`);
                      el.style.setProperty("--node-top", `${pos.y}px`);
                      el.style.setProperty("--node-width", `${NODE_WIDTH}px`);
                      el.style.setProperty("--node-height", `${NODE_HEIGHT}px`);
                    }
                  }}
                >
                  <div className={styles.nodeLabel}>
                    {screen.name}
                    {screen.path ? ` · ${screen.path}` : ""}
                  </div>
                  {domReportsByScreenId[screen.id] && (
                    <div className={styles.nodeLiveReport} title="Live-Daten von der App">
                      Live: {domReportsByScreenId[screen.id].route}
                      {domReportsByScreenId[screen.id].buttons != null &&
                        ` · ${domReportsByScreenId[screen.id].buttons!.length} Buttons`}
                    </div>
                  )}
                  {screenLoadState[screen.id] === "failed" ? (
                    <div
                      className={styles.nodeFailed}
                      role="status"
                      data-testid="screen-card-failed"
                      data-screen-id={screen.id}
                    >
                      <span className={styles.nodeFailedReason} data-testid="screen-fail-reason">
                        {screenFailReason[screen.id] ?? SCREEN_FAIL_REASONS.LOAD_ERROR}
                      </span>
                      {iframeSrc ? (
                        <a
                          href={iframeSrc}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.nodeOpenInTab}
                        >
                          In neuem Tab öffnen
                        </a>
                      ) : null}
                    </div>
                  ) : iframeSrc ? (
                    <div className={styles.nodeIframeWrap}>
                      <iframe
                        src={iframeSrc}
                        title={`Live: ${screen.name}`}
                        className={styles.nodeIframe}
                        data-testid="screen-card-iframe"
                        data-screen-id={screen.id}
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        onLoad={() => markScreenLoaded(screen.id, screen.name)}
                        onError={() =>
                          markScreenFailed(
                            screen.id,
                            SCREEN_FAIL_REASONS.LOAD_ERROR,
                            screen.name,
                            iframeSrc,
                          )
                        }
                        ref={(el) => {
                          if (el?.contentWindow)
                            iframeToScreenRef.current.set(el.contentWindow, screen.id);
                        }}
                      />
                      {screenLoadState[screen.id] === "loading" && (
                        <div
                          className={styles.nodeLoadingOverlay}
                          data-testid="screen-card-loading"
                        >
                          <Loader2 className={styles.nodeLoadingSpinner} aria-hidden="true" />
                          <span className={styles.nodeLoadingText}>Laden…</span>
                        </div>
                      )}
                      {screenLoadState[screen.id] === "loaded" && (
                        <div className={styles.nodeLoadedHint} role="status">
                          Falls Karte leer: Einbetten (X-Frame-Options/CSP) in der Preview-App
                          erlauben.
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={styles.nodePlaceholder}>{SCREEN_FAIL_REASONS.NO_URL}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Kanten (SVG) über den Nodes – so sind Verbindungen sichtbar */}
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

          {/* Klickbare unsichtbare Pfade für Kanten (über den sichtbaren Kanten) */}
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
        </div>
      </div>
    </div>
  );
}
