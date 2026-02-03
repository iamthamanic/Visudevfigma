import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { AlertCircle, Download, Loader2, Play, RefreshCw, Square } from "lucide-react";
import { useVisudev } from "../../../lib/visudev/store";
import { SitemapFlowView } from "../../../components/SitemapFlowView";
import { IntegrationsPanel } from "../../../components/IntegrationsPanel";
import { FlowGraphView } from "../components/FlowGraphView";
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

type AppFlowTab = "sitemap" | "integrations" | "flowgraph";

const PREVIEW_POLL_INTERVAL_MS = 2500;
const AUTO_PREVIEW_DELAY_MS = 800;

export function AppFlowPage({ projectId, githubRepo, githubBranch }: AppFlowPageProps) {
  const {
    activeProject,
    scanStatuses,
    startScan,
    preview,
    startPreview,
    refreshPreviewStatus,
    stopPreview,
  } = useVisudev();
  const [isRescan, setIsRescan] = useState(false);
  const [activeTab, setActiveTab] = useState<AppFlowTab>("sitemap");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoPreviewDoneRef = useRef(false);

  const handleRescan = useCallback(async () => {
    setIsRescan(true);
    try {
      await startScan("appflow");
    } finally {
      setIsRescan(false);
    }
  }, [startScan]);

  // Auto-scan when repo connected and no screens yet
  useEffect(() => {
    if (
      activeProject &&
      activeProject.screens.length === 0 &&
      scanStatuses.appflow.status === "idle"
    ) {
      handleRescan();
    }
  }, [activeProject, projectId, scanStatuses.appflow.status, handleRescan]);

  // On mount: fetch current preview status
  useEffect(() => {
    if (projectId) {
      void refreshPreviewStatus(projectId);
    }
  }, [projectId, refreshPreviewStatus]);

  // Auto-start preview when repo is connected and status still idle (once per project)
  useEffect(() => {
    if (
      !activeProject?.github_repo ||
      preview.projectId !== projectId ||
      preview.status !== "idle" ||
      autoPreviewDoneRef.current
    ) {
      if (preview.status === "ready" || preview.status === "starting") {
        autoPreviewDoneRef.current = true;
      }
      return;
    }
    const t = setTimeout(() => {
      autoPreviewDoneRef.current = true;
      void startPreview(projectId, activeProject.github_repo, activeProject.github_branch);
    }, AUTO_PREVIEW_DELAY_MS);
    return () => clearTimeout(t);
  }, [
    projectId,
    activeProject?.id,
    activeProject?.github_repo,
    activeProject?.github_branch,
    preview.projectId,
    preview.status,
    startPreview,
  ]);

  // Reset auto-preview flag when switching project
  useEffect(() => {
    autoPreviewDoneRef.current = false;
  }, [projectId]);

  // Poll preview status when starting
  useEffect(() => {
    if (preview.projectId === projectId && preview.status === "starting") {
      const tick = () => void refreshPreviewStatus(projectId);
      pollRef.current = setInterval(tick, PREVIEW_POLL_INTERVAL_MS);
      return () => {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
      };
    }
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, [projectId, preview.projectId, preview.status, refreshPreviewStatus]);

  const handleExportJson = useCallback(() => {
    if (!activeProject) return;
    const data = {
      screens: activeProject.screens,
      flows: activeProject.flows,
    };
    downloadFile(JSON.stringify(data, null, 2), `appflow-${projectId}.json`, "application/json");
  }, [activeProject, projectId]);

  const handleExportMermaid = useCallback(() => {
    if (!activeProject) return;
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
  }, [activeProject, projectId]);

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

        {hasData && !activeProject.deployed_url && !preview.previewUrl && (
          <div className={`${styles.statusBar} ${styles.statusInfo}`} role="status">
            <p className={styles.statusMeta}>
              💡 Echte Screens: <strong>Preview</strong> startet automatisch; oder im Projekt eine{" "}
              <strong>Deployed URL</strong> setzen.
            </p>
          </div>
        )}
      </div>

      <div className={styles.tabRow}>
        <button
          type="button"
          onClick={() => setActiveTab("sitemap")}
          className={clsx(styles.tab, activeTab === "sitemap" && styles.tabActive)}
          aria-pressed={activeTab === "sitemap"}
          aria-label="Sitemap-Ansicht"
        >
          Sitemap
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("integrations")}
          className={clsx(styles.tab, activeTab === "integrations" && styles.tabActive)}
          aria-pressed={activeTab === "integrations"}
          aria-label="Integrations-Ansicht"
        >
          Integrations
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("flowgraph")}
          className={clsx(styles.tab, activeTab === "flowgraph" && styles.tabActive)}
          aria-pressed={activeTab === "flowgraph"}
          aria-label="Flow-Graph-Ansicht"
        >
          Flow Graph
        </button>
      </div>

      <div className={styles.content}>
        <div className={styles.liveAppSplit}>
          <div className={styles.tabsPanel}>
            {activeTab === "integrations" ? (
              <div className={styles.tabPanel}>
                <IntegrationsPanel projectId={projectId} />
              </div>
            ) : activeTab === "flowgraph" ? (
              <div className={styles.tabPanel}>
                {hasData ? (
                  <FlowGraphView screens={activeProject.screens} flows={activeProject.flows} />
                ) : (
                  <div className={styles.centerState}>
                    <p className={styles.emptyTitle}>Keine Daten für Flow Graph</p>
                    <p className={styles.emptyHint}>
                      Sitemap und Flow Graph werden aus dem Repo gebaut.
                    </p>
                  </div>
                )}
              </div>
            ) : isScanning && !hasData ? (
              <div className={styles.centerState}>
                <div className={styles.emptyCard}>
                  <Loader2 className={`${styles.emptyIcon} ${styles.spinner}`} aria-hidden="true" />
                  <p className={styles.emptyTitle}>Code wird analysiert...</p>
                  <p className={styles.emptyHint}>Sitemap und Flow Graph werden gebaut.</p>
                </div>
              </div>
            ) : hasData ? (
              <SitemapFlowView
                screens={activeProject.screens}
                flows={activeProject.flows}
                projectData={{
                  id: activeProject.id,
                  deployed_url: activeProject.deployed_url ?? preview.previewUrl ?? undefined,
                }}
              />
            ) : (
              <div className={styles.centerState}>
                <div className={styles.emptyCard}>
                  <AlertCircle className={styles.emptyIcon} aria-hidden="true" />
                  <p className={styles.emptyTitle}>Noch keine Flows analysiert</p>
                  <p className={styles.emptyHint}>
                    Sitemap und Flow Graph werden automatisch aus dem Repository gebaut.
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

          <div className={styles.liveAppPanel}>
            {preview.projectId === projectId && preview.previewUrl ? (
              <div className={styles.liveAppWrap}>
                <div className={styles.liveAppBar}>
                  <span className={styles.liveAppLabel}>Live App (Preview)</span>
                  <button
                    type="button"
                    onClick={() => stopPreview(projectId)}
                    className={styles.secondaryButton}
                    aria-label="Preview beenden"
                  >
                    <Square className={styles.inlineIcon} aria-hidden="true" />
                    Preview beenden
                  </button>
                </div>
                <iframe
                  src={preview.previewUrl}
                  title="Live App Preview"
                  className={styles.liveAppIframe}
                  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                />
              </div>
            ) : preview.projectId === projectId && preview.status === "starting" ? (
              <div className={styles.liveAppPlaceholder}>
                <Loader2 className={`${styles.emptyIcon} ${styles.spinner}`} aria-hidden="true" />
                <p className={styles.emptyTitle}>Preview wird gestartet...</p>
                <p className={styles.emptyHint}>VisuDEV baut und startet die App aus dem Repo.</p>
              </div>
            ) : preview.projectId === projectId && preview.status === "failed" ? (
              <div className={styles.liveAppPlaceholder}>
                <AlertCircle className={styles.emptyIcon} aria-hidden="true" />
                <p className={styles.emptyTitle}>Preview fehlgeschlagen</p>
                <p className={styles.emptyHint}>{preview.error ?? "Unbekannter Fehler"}</p>
                <button
                  type="button"
                  onClick={() =>
                    startPreview(
                      projectId,
                      activeProject?.github_repo,
                      activeProject?.github_branch,
                    )
                  }
                  className={styles.primaryButton}
                >
                  <RefreshCw className={styles.inlineIcon} aria-hidden="true" />
                  Erneut versuchen
                </button>
              </div>
            ) : (
              <div className={styles.liveAppPlaceholder}>
                <p className={styles.emptyTitle}>Live App</p>
                <p className={styles.emptyHint}>
                  Die App aus dem Repo wird automatisch gebaut und hier angezeigt.
                </p>
                {activeProject?.github_repo ? (
                  <button
                    type="button"
                    onClick={() =>
                      startPreview(
                        projectId,
                        activeProject?.github_repo,
                        activeProject?.github_branch,
                      )
                    }
                    className={styles.primaryButton}
                    aria-label="Preview starten"
                  >
                    <Play className={styles.inlineIcon} aria-hidden="true" />
                    Preview starten
                  </button>
                ) : (
                  <p className={styles.emptyHint}>Verbinde ein GitHub-Repo im Projekt.</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
