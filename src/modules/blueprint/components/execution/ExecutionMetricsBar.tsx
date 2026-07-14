/**
 * Metrics bar — totals come from projected step timings, not live telemetry.
 */

import type { ExecutionMetrics } from "./_projection.js";
import styles from "../../styles/ExecutionView.module.css";

export interface ExecutionMetricsBarProps {
  metrics: ExecutionMetrics;
}

export function ExecutionMetricsBar({ metrics }: ExecutionMetricsBarProps): JSX.Element {
  const errorLabel = metrics.errorCount === 1 ? "Fehler" : "Fehler";

  return (
    <div className={styles.metricsBar} aria-label="Ausführungs-Metriken">
      <span>{metrics.totalDurationMs}ms</span>
      <span className={styles.metricsDivider} aria-hidden="true">
        ·
      </span>
      <span>
        {metrics.stepCount} {metrics.stepCount === 1 ? "Schritt" : "Schritte"}
      </span>
      <span className={styles.metricsDivider} aria-hidden="true">
        ·
      </span>
      <span className={metrics.errorCount > 0 ? styles.metricsError : undefined}>
        {metrics.errorCount} {errorLabel}
      </span>
    </div>
  );
}
