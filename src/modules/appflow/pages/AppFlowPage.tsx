import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Download, Loader2, RefreshCw } from "lucide-react";
import { useVisudev } from "../../../lib/visudev/store";
import { SitemapFlowView } from "../../../components/SitemapFlowView";
import styles from "../styles/AppFlowPage.module.css";

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

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

  const handleExportJson = useCallback(() => {
    const data = {
      screens: activeProject.screens,
      flows: activeProject.flows,
    };
    downloadFile(JSON.stringify(data, null, 2), `appflow-${projectId}.json`, "application/json");
  }, [activeProject.screens, activeProject.flows, projectId]);

  const handleExportMermaid = useCallback(() => {
    const id = (s: string) => s.replace(/\s+/g, "_").replace(/-/g, "_") || "n";
    const lines: string[] = ["flowchart LR"];
    const seen = new Set<string>();
    activeProject.screens.forEach((s) => {
      const n = id(s.name);
      if (!seen.has(n)) {
        seen.add(n);
        lines.push(`  ${n}["${s.name}"]`);
      }
    });
    activeProject.flows.forEach((f) => {
      const from = id(f.name);
      f.calls.forEach((c) => {
        const to = id(c);
        lines.push(`  ${from} --> ${to}`);
      });
    });
    if (lines.length === 1) lines.push("  empty[Keine Flows]");
    downloadFile(lines.join("\n"), `appflow-${projectId}.md`, "text/markdown");
  }, [activeProject.screens, activeProject.flows, projectId]);

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
          <div className={styles.headerActions}>
            <button
              type="button"
              onClick={handleExportJson}
              className={styles.secondaryButton}
              aria-label="App Flow als JSON exportieren"
            >
              <Download className={styles.inlineIcon} aria-hidden="true" />
              Export JSON
            </button>
            <button
              type="button"
              onClick={handleExportMermaid}
              className={styles.secondaryButton}
              aria-label="App Flow als Mermaid exportieren"
            >
              <Download className={styles.inlineIcon} aria-hidden="true" />
              Export Mermaid
            </button>
            <button
              type="button"
              onClick={handleRescan}
              disabled={isScanning}
              className={styles.primaryButton}
            >
              {isScanning ? (
                <>
                  <Loader2
                    className={`${styles.inlineIcon} ${styles.spinner}`}
                    aria-hidden="true"
                  />
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
              <p className={styles.emptyTitle}>Noch keine Flows analysiert</p>
              <p className={styles.emptyHint}>
                Starte einen Scan, um Screens und Flows aus dem Repository zu laden.
              </p>
              <button
                type="button"
                onClick={handleRescan}
                disabled={isScanning}
                className={styles.primaryButton}
              >
                <RefreshCw className={styles.inlineIcon} aria-hidden="true" />
                Scan starten
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
