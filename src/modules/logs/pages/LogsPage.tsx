import { useVisudev } from "../../../lib/visudev/store";
import { AlertCircle } from "lucide-react";
import clsx from "clsx";
import styles from "../styles/LogsPage.module.css";

interface LogsPageProps {
  projectId: string;
}

export function LogsPage({ projectId }: LogsPageProps) {
  const { activeProject, scans } = useVisudev();

  const projectScans = scans.filter((scan) => scan.projectId === projectId);

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Logs</h1>
          <p className={styles.subtitle}>Scan History • {activeProject?.name}</p>
        </div>
      </div>

      <div className={styles.content}>
        {projectScans.length === 0 ? (
          <div className={styles.emptyState}>
            <AlertCircle className={styles.emptyIcon} />
            <p className={styles.emptyTitle}>Keine Scans vorhanden</p>
            <p className={styles.emptyHint}>Führe eine Analyse durch um Scan-Logs zu sehen</p>
          </div>
        ) : (
          <div className={styles.list}>
            {projectScans.map((scan) => {
              const statusClass = clsx(styles.statusPill, {
                [styles.statusCompleted]: scan.status === "completed",
                [styles.statusRunning]: scan.status === "running",
                [styles.statusFailed]: scan.status === "failed",
                [styles.statusNeutral]:
                  scan.status !== "completed" &&
                  scan.status !== "running" &&
                  scan.status !== "failed",
              });

              return (
                <div key={scan.id} className={styles.card}>
                  <div className={styles.cardHeader}>
                    <div className={styles.cardTitleRow}>
                      <span className={styles.cardTitle}>{scan.scanType.toUpperCase()}</span>
                      <span className={statusClass}>{scan.status}</span>
                    </div>
                    <div className={styles.timestamp}>
                      {new Date(scan.startedAt).toLocaleString("de-DE")}
                    </div>
                  </div>

                  {scan.status === "running" && (
                    <div className={styles.progressRow}>
                      <progress className={styles.progressBar} value={scan.progress} max={100} />
                      <p className={styles.progressLabel}>{scan.progress}%</p>
                    </div>
                  )}

                  {scan.status === "completed" && scan.result && (
                    <div className={styles.result}>
                      <p>
                        ✅ {scan.result.stats.totalScreens} Screens • {scan.result.stats.totalFlows}{" "}
                        Flows
                      </p>
                    </div>
                  )}

                  {scan.status === "failed" && scan.errorMessage && (
                    <div className={clsx(styles.result, styles.resultError)}>
                      <p>❌ {scan.errorMessage}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
