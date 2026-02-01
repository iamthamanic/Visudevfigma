import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useVisudev } from "../../../lib/visudev/store";
import styles from "../styles/BlueprintPage.module.css";

interface BlueprintPageProps {
  projectId: string;
}

export function BlueprintPage({ projectId }: BlueprintPageProps) {
  const { activeProject, scanStatuses, startScan } = useVisudev();
  const [isRescan, setIsRescan] = useState(false);

  const handleRescan = useCallback(async () => {
    setIsRescan(true);
    try {
      await startScan("blueprint");
    } finally {
      setIsRescan(false);
    }
  }, [startScan]);

  useEffect(() => {
    if (activeProject && scanStatuses.blueprint.status === "idle") {
      handleRescan();
    }
  }, [activeProject, projectId, scanStatuses.blueprint.status, handleRescan]);

  const isScanning = scanStatuses.blueprint.status === "running" || isRescan;
  const hasError = scanStatuses.blueprint.status === "failed";

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Blueprint</h1>
            <p className={styles.subtitle}>Architektur-Übersicht • {activeProject?.name}</p>
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
            </div>
          </div>
        ) : (
          <div className={styles.centerState}>
            <div className={styles.emptyCard}>
              <p className={styles.emptyHint}>
                Blueprint Feature wird in einer späteren Version verfügbar sein
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
