/**
 * Six evolution metrics with sparklines derived from diff and git summary.
 */

import type { GitSummary, SoftwareGraphDiffMetadata, SoftwareGraphSnapshot } from "../../types";
import { MetricCard } from "../ui/MetricCard.js";
import { ViewSectionTitle } from "../ui/ViewSectionTitle.js";
import styles from "../../styles/EvolutionView.module.css";

interface EvolutionMetricsRowProps {
  diff: SoftwareGraphDiffMetadata | null;
  gitSummary: GitSummary | null;
  snapshots: SoftwareGraphSnapshot[];
}

function snapshotNodeSparkline(snapshots: SoftwareGraphSnapshot[]): number[] {
  return snapshots.slice(-6).map((snapshot) => snapshot.nodeIds.length);
}

export function EvolutionMetricsRow({
  diff,
  gitSummary,
  snapshots,
}: EvolutionMetricsRowProps): JSX.Element {
  const added = diff?.addedNodeIds.length ?? 0;
  const changed = diff?.changedNodeIds.length ?? 0;
  const removed = diff?.removedNodeIds.length ?? 0;
  const totalNodes = added + changed + removed;
  const commits = gitSummary?.commits.length ?? 0;
  const working =
    (gitSummary?.workingTree.added.length ?? 0) +
    (gitSummary?.workingTree.modified.length ?? 0) +
    (gitSummary?.workingTree.deleted.length ?? 0);

  const sparkline = snapshotNodeSparkline(snapshots);

  const metrics = [
    { label: "Neu", value: added, accent: "green" as const },
    { label: "Geändert", value: changed, accent: "amber" as const },
    { label: "Entfernt", value: removed, accent: "orange" as const },
    { label: "Knoten Δ", value: totalNodes, accent: "purple" as const },
    { label: "Commits", value: commits, accent: "blue" as const },
    { label: "Working Tree", value: working, accent: "teal" as const },
  ];

  return (
    <section className={styles.metricsSection}>
      <ViewSectionTitle>Evolutions-Metriken</ViewSectionTitle>
      <div className={styles.metricsRow}>
        {metrics.map((metric) => (
          <MetricCard
            key={metric.label}
            label={metric.label}
            value={String(metric.value)}
            accent={metric.accent}
            sparklineValues={sparkline.length > 0 ? sparkline : [metric.value]}
            testId="evolution-metric-card"
          />
        ))}
      </div>
    </section>
  );
}
