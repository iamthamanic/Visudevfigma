import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Download, Loader2, RefreshCw } from "lucide-react";
import { useVisudev } from "../../../lib/visudev/store";
import { getVisuDevClient, isLocalVisuDevMode } from "../../../lib/visudev-api";
import { blueprintAPI } from "../../../utils/api";
import { BlueprintViewShell } from "../components/BlueprintViewShell";
import { normalizeBlueprintData } from "../../../lib/visudev/normalize-blueprint";
import { getProjectSourceMode } from "../../../lib/visudev/project-source";
import type { BlueprintData } from "../types";
import styles from "../styles/BlueprintPage.module.css";

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

interface BlueprintPageProps {
  projectId: string;
}

export function BlueprintPage({ projectId }: BlueprintPageProps) {
  const { activeProject, scanStatuses, startScan } = useVisudev();
  const [isRescan, setIsRescan] = useState(false);
  const [blueprint, setBlueprint] = useState<BlueprintData | null>(null);
  const [blueprintLoadError, setBlueprintLoadError] = useState<string | null>(null);

  const loadBlueprint = useCallback(async () => {
    if (!projectId) return;
    setBlueprintLoadError(null);
    if (isLocalVisuDevMode()) {
      const latest = await getVisuDevClient().getBlueprintLatest(projectId);
      if (latest?.blueprint) {
        setBlueprint(normalizeBlueprintData(latest.blueprint as Record<string, unknown>));
      } else {
        setBlueprint(null);
      }
      return;
    }
    const res = await blueprintAPI.get(projectId);
    if (res.success && res.data) {
      setBlueprint(normalizeBlueprintData(res.data as Record<string, unknown>));
    } else {
      setBlueprint(null);
      if (!res.success)
        setBlueprintLoadError(res.error ?? "Blueprint konnte nicht geladen werden.");
    }
  }, [projectId]);

  const handleRescan = useCallback(async () => {
    setIsRescan(true);
    try {
      await startScan("blueprint");
    } finally {
      setIsRescan(false);
    }
  }, [startScan]);

  useEffect(() => {
    if (
      activeProject &&
      (!isLocalVisuDevMode() || activeProject.local_path) &&
      scanStatuses.blueprint.status === "idle"
    ) {
      handleRescan();
    }
  }, [activeProject, projectId, scanStatuses.blueprint.status, handleRescan]);

  useEffect(() => {
    if (projectId && scanStatuses.blueprint.status !== "running" && !isRescan) {
      loadBlueprint();
    }
  }, [projectId, scanStatuses.blueprint.status, isRescan, loadBlueprint]);

  const isScanning = scanStatuses.blueprint.status === "running" || isRescan;
  const hasError = scanStatuses.blueprint.status === "failed";
  const scanError = scanStatuses.blueprint.error;
  const isLocalProject = activeProject ? getProjectSourceMode(activeProject) === "local" : false;
  const scanCompleted = scanStatuses.blueprint.status === "completed";
  const hasContent =
    (blueprint?.graph != null &&
      (blueprint.graph.nodes.length > 0 || blueprint.graph.edges.length > 0)) ||
    (Array.isArray(blueprint?.routes) && blueprint.routes.length > 0) ||
    (Array.isArray(blueprint?.findings) && blueprint.findings.length > 0) ||
    (Array.isArray(blueprint?.facts) && blueprint.facts.length > 0);
  const hasData = blueprint != null && (scanCompleted || hasContent);

  const handleExportJson = useCallback(() => {
    const data = blueprint ?? {};
    downloadFile(JSON.stringify(data, null, 2), `blueprint-${projectId}.json`, "application/json");
  }, [blueprint, projectId]);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Blueprint</h1>
            <p className={styles.subtitle}>
              Technische Diagnose · {activeProject?.name}
              {isLocalProject && activeProject?.local_path && <> · {activeProject.local_path}</>}
              {!isLocalProject && blueprint?.commitSha && (
                <> · {String(blueprint.commitSha).slice(0, 8)}</>
              )}
            </p>
          </div>
          <div className={styles.headerActions}>
            <button
              type="button"
              onClick={handleExportJson}
              className={styles.secondaryButton}
              aria-label="Blueprint als JSON exportieren"
            >
              <Download className={styles.inlineIcon} aria-hidden="true" />
              Export JSON
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
          <div className={`${styles.statusBar} ${styles.statusInfo}`} role="status">
            <Loader2 className={`${styles.inlineIcon} ${styles.spinner}`} aria-hidden="true" />
            <div>
              <p className={styles.statusTitle}>Blueprint wird analysiert...</p>
              <p className={styles.statusMeta}>
                {isLocalProject
                  ? `Lokal: ${activeProject?.local_path ?? "—"}`
                  : `Repo: ${activeProject?.github_repo ?? "—"} @ ${activeProject?.github_branch ?? "main"}`}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className={styles.content}>
        {isScanning ? (
          <div className={styles.centerState}>
            <div className={styles.emptyCard}>
              <Loader2 className={`${styles.emptyIcon} ${styles.spinner}`} aria-hidden="true" />
              <p className={styles.emptyTitle}>Blueprint wird generiert...</p>
            </div>
          </div>
        ) : hasError ? (
          <div className={styles.centerState}>
            <div className={styles.emptyCard}>
              <AlertCircle
                className={`${styles.emptyIcon} ${styles.errorIcon}`}
                aria-hidden="true"
              />
              <p className={styles.emptyTitle}>Fehler bei der Blueprint-Generierung</p>
              {scanError ? <p className={styles.emptyHint}>{scanError}</p> : null}
            </div>
          </div>
        ) : !hasData ? (
          <div className={styles.centerState}>
            <div className={styles.emptyCard}>
              <p className={styles.emptyHint}>
                {blueprintLoadError ??
                  (isLocalProject
                    ? "Keine Blueprint-Daten. Starte „Neu analysieren“ (npm run dev muss laufen)."
                    : "Keine Blueprint-Daten. Starte „Neu analysieren“ oder verbinde ein GitHub-Repo.")}
              </p>
            </div>
          </div>
        ) : blueprint ? (
          <BlueprintViewShell blueprint={blueprint} projectId={projectId} />
        ) : null}
      </div>
    </div>
  );
}
