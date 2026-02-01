import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useVisudev } from "../../../lib/visudev/store";
import { SitemapFlowView } from "../../../components/SitemapFlowView";
import styles from "../styles/AppFlowPage.module.css";

interface AppFlowPageProps {
  projectId: string;
  githubRepo?: string;
  githubBranch?: string;
}

export function AppFlowPage({ projectId, githubRepo, githubBranch }: AppFlowPageProps) {
  const { activeProject, scanStatuses, startScan } = useVisudev();
  const [isRescan, setIsRescan] = useState(false);

  const handleRescan = useCallback(async () => {
    setIsRescan(true);
    try {
      await startScan("appflow");
    } finally {
      setIsRescan(false);
    }
  }, [startScan]);

  useEffect(() => {
    if (
      activeProject &&
      activeProject.screens.length === 0 &&
      scanStatuses.appflow.status === "idle"
    ) {
      handleRescan();
    }
  }, [activeProject, projectId, scanStatuses.appflow.status, handleRescan]);

  if (!activeProject) {
    return (
      <div className={styles.centerState}>
        <p className={styles.emptyTitle}>Kein Projekt ausgewählt</p>
      </div>
    );
  }

  const isScanning = scanStatuses.appflow.status === "running" || isRescan;
  const hasError = scanStatuses.appflow.status === "failed";
  const hasData = activeProject.screens.length > 0;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>App Flow</h1>
            <p className={styles.subtitle}>
              {activeProject.name} • {activeProject.screens.length} Screens •{" "}
              {activeProject.flows.length} Flows
            </p>
          </div>
          <button
            type="button"
            onClick={handleRescan}
            disabled={isScanning}
            className={styles.primaryButton}
          >
            {isScanning ? (
              <>
                <Loader2 className={`${styles.inlineIcon} ${styles.spinner}`} aria-hidden="true" />
                Analysiere...
              </>
            ) : (
              <>
                <RefreshCw className={styles.inlineIcon} aria-hidden="true" />
                Neu analysieren
              </>
            )}
          </button>
        </div>

        {isScanning && (
          <div className={`${styles.statusBar} ${styles.statusInfo}`}>
            <Loader2 className={`${styles.inlineIcon} ${styles.spinner}`} aria-hidden="true" />
            <div>
              <p className={styles.statusTitle}>Code wird analysiert...</p>
              <p className={styles.statusMeta}>
                Repo: {githubRepo || "unknown"} @ {githubBranch || "main"}
              </p>
            </div>
          </div>
        )}

        {hasError && (
          <div className={`${styles.statusBar} ${styles.statusError}`}>
            <AlertCircle className={styles.inlineIcon} aria-hidden="true" />
            <div>
              <p className={styles.statusTitle}>Fehler bei der Analyse</p>
              <p className={styles.statusMeta}>
                {scanStatuses.appflow.error || "Unbekannter Fehler"}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className={styles.content}>
        {isScanning && !hasData ? (
          <div className={styles.centerState}>
            <div className={styles.emptyCard}>
              <Loader2 className={`${styles.emptyIcon} ${styles.spinner}`} aria-hidden="true" />
              <p className={styles.emptyTitle}>Code wird analysiert...</p>
              <p className={styles.emptyHint}>Dies kann einige Sekunden dauern</p>
            </div>
          </div>
        ) : hasData ? (
          <SitemapFlowView screens={activeProject.screens} flows={activeProject.flows} />
        ) : (
          <div className={styles.centerState}>
            <div className={styles.emptyCard}>
              <AlertCircle className={styles.emptyIcon} aria-hidden="true" />
              <p className={styles.emptyTitle}>Keine Daten vorhanden</p>
              <p className={styles.emptyHint}>Starte eine Analyse um Screens und Flows zu sehen</p>
              <button type="button" onClick={handleRescan} className={styles.primaryButton}>
                <RefreshCw className={styles.inlineIcon} aria-hidden="true" />
                Jetzt analysieren
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
