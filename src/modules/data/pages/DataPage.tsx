import { useCallback, useEffect, useState } from "react";
import { AlertCircle, Loader2, RefreshCw } from "lucide-react";
import { useVisudev } from "../../../lib/visudev/store";
import styles from "../styles/DataPage.module.css";

interface DataPageProps {
  projectId: string;
}

export function DataPage({ projectId }: DataPageProps) {
  const { activeProject, scanStatuses, startScan } = useVisudev();
  const [isRescan, setIsRescan] = useState(false);

  const handleRescan = useCallback(async () => {
    setIsRescan(true);
    try {
      await startScan("data");
    } finally {
      setIsRescan(false);
    }
  }, [startScan]);

  useEffect(() => {
    if (activeProject && scanStatuses.data.status === "idle") {
      handleRescan();
    }
  }, [activeProject, projectId, scanStatuses.data.status, handleRescan]);

  const isScanning = scanStatuses.data.status === "running" || isRescan;
  const hasError = scanStatuses.data.status === "failed";

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className={styles.headerRow}>
          <div>
            <h1 className={styles.title}>Data</h1>
            <p className={styles.subtitle}>Datenbank-Schema • {activeProject?.name}</p>
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
              <p className={styles.emptyTitle}>Schema wird analysiert...</p>
            </div>
          </div>
        ) : hasError ? (
          <div className={styles.centerState}>
            <div className={styles.emptyCard}>
              <AlertCircle
                className={`${styles.emptyIcon} ${styles.errorIcon}`}
                aria-hidden="true"
              />
              <p className={styles.emptyTitle}>Fehler bei der Schema-Analyse</p>
            </div>
          </div>
        ) : (
          <div className={styles.centerState}>
            <div className={styles.emptyCard}>
              <p className={styles.emptyHint}>
                Data Schema Feature wird in einer späteren Version verfügbar sein
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
