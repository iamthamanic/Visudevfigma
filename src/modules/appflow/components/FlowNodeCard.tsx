/**
 * FlowNodeCard – Einzelne Screen-Karte im Live Flow (Label, Iframe, Fehler oder Platzhalter).
 * Location: src/modules/appflow/components/FlowNodeCard.tsx
 */

import { Loader2 } from "lucide-react";
import type { Screen } from "../../../lib/visudev/types";
import type { VisudevDomReport } from "../types";
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
  onLoad: () => void;
  onError: (reason: string, name: string, url: string) => void;
  registerIframe: (win: Window, screenId: string) => void;
  nodeWidth: number;
  nodeHeight: number;
}

export function FlowNodeCard({
  screen,
  pos,
  iframeSrc,
  loadState,
  failReason,
  domReport,
  onLoad,
  onError,
  registerIframe,
  nodeWidth,
  nodeHeight,
}: FlowNodeCardProps) {
  const reason = failReason ?? NODE_FAIL_REASONS.LOAD_ERROR;
  const isConnectionError =
    /ECONNREFUSED|Bad Gateway|nicht erreichbar|502|-102|Verbindung verweigert/i.test(reason);

  return (
    <div
      className={styles.nodeCard}
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
        {screen.name}
        {screen.path ? ` · ${screen.path}` : ""}
      </div>
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
            onLoad={onLoad}
            onError={() => onError(NODE_FAIL_REASONS.LOAD_ERROR, screen.name, iframeSrc)}
            ref={(el) => {
              if (el?.contentWindow) registerIframe(el.contentWindow, screen.id);
            }}
          />
          {loadState === "loading" && (
            <div className={styles.nodeLoadingOverlay} data-testid="screen-card-loading">
              <Loader2 className={styles.nodeLoadingSpinner} aria-hidden="true" />
              <span className={styles.nodeLoadingText}>Laden…</span>
            </div>
          )}
          {loadState === "loaded" && (
            <div className={styles.nodeLoadedHint} role="status">
              Fehlermeldung (Bad Gateway/ECONNREFUSED)? → Preview-App läuft nicht, „Preview neu
              starten“. Karte ganz leer? → Einbetten (X-Frame-Options/CSP) in der Preview-App
              erlauben.
            </div>
          )}
        </div>
      ) : (
        <div className={styles.nodePlaceholder}>{NODE_FAIL_REASONS.NO_URL}</div>
      )}
    </div>
  );
}
