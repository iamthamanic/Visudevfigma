/**
 * Metrics bar — totals come from projected step timings, not live telemetry.
 */

import type { ExecutionMetrics } from "./_projection.js";
import styles from "../../styles/ExecutionView.module.css";

export interface ExecutionMetricsBarProps {
  metrics: ExecutionMetrics;
}

export function ExecutionMetricsBar({ metrics }: ExecutionMetricsBarProps): JSX.Element {
  return (
    <div
      className={styles.metricsBar}
      aria-label="Ausführungs-Metriken"
      data-testid="execution-metrics-bar"
    >
      <span>Gesamtdauer: {metrics.totalDurationMs}ms</span>
      <span className={styles.metricsDivider} aria-hidden="true">
        ·
      </span>
      <span>Schritte: {metrics.stepCount}</span>
      <span className={styles.metricsDivider} aria-hidden="true">
        ·
      </span>
      <span className={metrics.errorCount > 0 ? styles.metricsError : undefined}>
        Fehler: {metrics.errorCount}
      </span>
      <span className={styles.metricsDivider} aria-hidden="true">
        ·
      </span>
      <span>Warnungen: {metrics.warningCount}</span>
      <span className={styles.metricsDivider} aria-hidden="true">
        ·
      </span>
      <span>Services: {metrics.serviceCount}</span>
      <span className={styles.metricsDivider} aria-hidden="true">
        ·
      </span>
      <span>DB: {metrics.dbCount}</span>
      <span className={styles.metricsDivider} aria-hidden="true">
        ·
      </span>
      <span>Events: {metrics.eventCount}</span>
      <span className={styles.metricsDivider} aria-hidden="true">
        ·
      </span>
      <span>Payload: {metrics.payloadCount}</span>
    </div>
  );
}
