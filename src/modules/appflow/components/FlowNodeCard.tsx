/**
 * FlowNodeCard – Einzelne Screen-Karte im Live Flow (Label, Iframe, Fehler oder Platzhalter).
 * Location: src/modules/appflow/components/FlowNodeCard.tsx
 */

import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import type { Screen } from "../../../lib/visudev/types";
import type { NodeViewportMode, VisudevDomReport } from "../types";
import styles from "../styles/LiveFlowCanvas.module.css";

export const NODE_FAIL_REASONS = {
  LOAD_ERROR:
    "Ladefehler (-102 = Verbindung verweigert: nichts läuft unter der URL). „Preview starten“ oder Deployed-URL prüfen.",
  NO_URL: "Keine URL: Basis-URL oder Screen-Pfad fehlt.",
} as const;

interface FlowNodeCardProps {
  screen: Screen;
  pos: { x: number; y: number };
  iframeSrc: string;
  loadState: "loading" | "loaded" | "failed";
  failReason: string | undefined;
  domReport: VisudevDomReport | undefined;
  viewportMode: NodeViewportMode;
  authRequired: boolean;
  authRoute?: string;
  onFocus: (screenId: string, screenName: string, iframeSrc: string) => void;
  onLoad: () => void;
  onError: (reason: string, name: string, url: string) => void;
  registerIframe: (win: Window, screenId: string) => void;
  nodeWidth: number;
  nodeHeight: number;
}

const VIEWPORT_PRESETS: Record<NodeViewportMode, { width: number; height: number }> = {
  "fit-desktop": { width: 1366, height: 768 },
  "fit-mobile": { width: 390, height: 844 },
};

export function FlowNodeCard({
  screen,
  pos,
  iframeSrc,
  loadState,
  failReason,
  domReport,
  viewportMode,
  authRequired,
  authRoute,
  onFocus,
  onLoad,
  onError,
  registerIframe,
  nodeWidth,
  nodeHeight,
}: FlowNodeCardProps) {
  const reason = failReason ?? NODE_FAIL_REASONS.LOAD_ERROR;
  const isConnectionError =
    /ECONNREFUSED|Bad Gateway|nicht erreichbar|502|-102|Verbindung verweigert/i.test(reason);
  const looksLikeGenericNavigateName = /^navigate$/i.test((screen.name || "").trim());
  const displayName =
    looksLikeGenericNavigateName && screen.path ? `Route ${screen.path}` : screen.name;
  const viewportPreset = useMemo(() => VIEWPORT_PRESETS[viewportMode], [viewportMode]);
  const viewportSurfaceRef = useRef<HTMLDivElement | null>(null);
  const [viewportScale, setViewportScale] = useState(1);

  useEffect(() => {
    const el = viewportSurfaceRef.current;
    if (!el) return;
    el.style.setProperty("--node-viewport-width", `${viewportPreset.width}px`);
    el.style.setProperty("--node-viewport-height", `${viewportPreset.height}px`);
    el.style.setProperty("--node-viewport-scale", `${viewportScale}`);
  }, [viewportPreset.height, viewportPreset.width, viewportScale]);

  useEffect(() => {
    const el = viewportSurfaceRef.current;
    if (!el) return;
    const recalc = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      const scale = Math.min(
        rect.width / viewportPreset.width,
        rect.height / viewportPreset.height,
      );
      if (Number.isFinite(scale) && scale > 0) setViewportScale(scale);
    };
    recalc();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(recalc) : null;
    ro?.observe(el);
    window.addEventListener("resize", recalc);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", recalc);
    };
  }, [viewportPreset.height, viewportPreset.width]);

  return (
    <div
      className={styles.nodeCard}
      data-node-card="true"
      ref={(el) => {
        if (el) {
          el.style.setProperty("--node-left", `${pos.x}px`);
          el.style.setProperty("--node-top", `${pos.y}px`);
          el.style.setProperty("--node-width", `${nodeWidth}px`);
          el.style.setProperty("--node-height", `${nodeHeight}px`);
        }
      }}
    >
      <div className={styles.nodeLabel}>
        {displayName}
        {screen.path ? ` · ${screen.path}` : ""}
      </div>
      {iframeSrc && (
        <div className={styles.nodeActions}>
          <button
            type="button"
            className={styles.nodeFocusBtn}
            onClick={() => onFocus(screen.id, displayName, iframeSrc)}
          >
            Fokus
          </button>
        </div>
      )}
      {authRequired && (
        <div className={styles.nodeAuthBadge}>
          Auth erforderlich{authRoute ? ` (redirect: ${authRoute})` : ""}
        </div>
      )}
      {domReport && (
        <div className={styles.nodeLiveReport} title="Live-Daten von der App">
          Live: {domReport.route}
          {domReport.buttons != null && ` · ${domReport.buttons.length} Buttons`}
        </div>
      )}
      {loadState === "failed" ? (
        <div
          className={styles.nodeFailed}
          role="status"
          data-testid="screen-card-failed"
          data-screen-id={screen.id}
        >
          <span className={styles.nodeFailedReason} data-testid="screen-fail-reason">
            {reason}
          </span>
          {isConnectionError && (
            <span className={styles.nodeFailedAction}>
              → „Preview neu starten“ oben oder Docker prüfen.
            </span>
          )}
        </div>
      ) : iframeSrc ? (
        <div className={styles.nodeIframeWrap} ref={viewportSurfaceRef}>
          <div className={styles.nodeViewportStage}>
            <iframe
              src={iframeSrc}
              title={`Live: ${displayName}`}
              className={styles.nodeIframe}
              data-testid="screen-card-iframe"
              data-screen-id={screen.id}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              onLoad={onLoad}
              onError={() => onError(NODE_FAIL_REASONS.LOAD_ERROR, displayName, iframeSrc)}
              ref={(el) => {
                if (el?.contentWindow) registerIframe(el.contentWindow, screen.id);
              }}
            />
          </div>
          {loadState === "loading" && (
            <div className={styles.nodeLoadingOverlay} data-testid="screen-card-loading">
              <Loader2 className={styles.nodeLoadingSpinner} aria-hidden="true" />
              <span className={styles.nodeLoadingText}>Laden…</span>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.nodePlaceholder}>{NODE_FAIL_REASONS.NO_URL}</div>
      )}
    </div>
  );
}
