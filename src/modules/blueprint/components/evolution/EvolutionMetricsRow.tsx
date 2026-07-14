/**
 * Evolutions-Metriken row from snapshot diff stats.
 */

import type { SoftwareGraphDiffMetadata } from "../../types";
import { MetricCard } from "../ui/MetricCard.js";
import { ViewSectionTitle } from "../ui/ViewSectionTitle.js";
import styles from "../../styles/EvolutionView.module.css";

interface EvolutionMetricsRowProps {
  diff: SoftwareGraphDiffMetadata | null;
}

export function EvolutionMetricsRow({ diff }: EvolutionMetricsRowProps): JSX.Element {
  const added = diff?.addedNodeIds.length ?? 0;
  const changed = diff?.changedNodeIds.length ?? 0;
  const removed = diff?.removedNodeIds.length ?? 0;

  return (
    <section className={styles.metricsSection}>
      <ViewSectionTitle>Evolutions-Metriken</ViewSectionTitle>
      <div className={styles.metricsRow}>
        <MetricCard label="Neu" value={String(added)} accent="green" />
        <MetricCard label="Geändert" value={String(changed)} accent="amber" />
        <MetricCard label="Entfernt" value={String(removed)} accent="orange" />
      </div>
    </section>
  );
}
