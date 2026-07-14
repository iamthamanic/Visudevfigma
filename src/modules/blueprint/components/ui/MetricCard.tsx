/**
 * Metric summary card for Evolution and dashboard rows in Blueprint views.
 * Location: src/modules/blueprint/components/ui/
 */

import styles from "./MetricCard.module.css";

interface MetricCardProps {
  label: string;
  value: string;
  delta?: string;
  accent?: "green" | "orange" | "purple" | "blue" | "teal" | "amber";
}

export function MetricCard({ label, value, delta, accent = "blue" }: MetricCardProps): JSX.Element {
  return (
    <article className={styles.root} data-accent={accent}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value}</p>
      {delta ? <p className={styles.delta}>{delta}</p> : null}
      <div className={styles.sparkline} aria-hidden="true" />
    </article>
  );
}
