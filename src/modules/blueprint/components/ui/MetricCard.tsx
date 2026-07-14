/**
 * Metric summary card for Evolution and dashboard rows in Blueprint views.
 * Location: src/modules/blueprint/components/ui/
 */

import styles from "./MetricCard.module.css";
import { MetricSparkline } from "./MetricSparkline.js";

interface MetricCardProps {
  label: string;
  value: string;
  delta?: string;
  accent?: "green" | "orange" | "purple" | "blue" | "teal" | "amber";
  sparklineValues?: number[];
}

export function MetricCard({
  label,
  value,
  delta,
  accent = "blue",
  sparklineValues,
}: MetricCardProps): JSX.Element {
  return (
    <article className={styles.root} data-accent={accent}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value}</p>
      {delta ? <p className={styles.delta}>{delta}</p> : null}
      {sparklineValues ? (
        <MetricSparkline values={sparklineValues} />
      ) : (
        <div className={styles.sparkline} aria-hidden="true" />
      )}
    </article>
  );
}
