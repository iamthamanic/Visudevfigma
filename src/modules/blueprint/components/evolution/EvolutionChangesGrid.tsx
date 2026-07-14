/**
 * EvolutionChangesGrid — Figma four-column change summary for diff + working tree.
 */

import type { GitSummary, SoftwareGraphDiffMetadata } from "../../types";
import styles from "../../styles/EvolutionView.module.css";

export interface EvolutionChangesGridProps {
  diff: SoftwareGraphDiffMetadata | null;
  gitSummary: GitSummary | null;
}

export function EvolutionChangesGrid({ diff, gitSummary }: EvolutionChangesGridProps): JSX.Element {
  const added = diff?.addedNodeIds.length ?? 0;
  const changed = diff?.changedNodeIds.length ?? 0;
  const removed = diff?.removedNodeIds.length ?? 0;
  const working =
    (gitSummary?.workingTree.added.length ?? 0) +
    (gitSummary?.workingTree.modified.length ?? 0) +
    (gitSummary?.workingTree.deleted.length ?? 0);

  const changeMetrics = [
    { id: "added", label: "Hinzugefügt", value: added },
    { id: "changed", label: "Geändert", value: changed },
    { id: "removed", label: "Entfernt", value: removed },
    { id: "working", label: "Working Tree", value: working },
  ];

  return (
    <section className={styles.changesGridSection} aria-label="Änderungsübersicht">
      <div className={styles.changesGrid}>
        {changeMetrics.map((changeMetric) => (
          <article
            key={changeMetric.id}
            className={styles.changesColumn}
            data-kind={changeMetric.id}
            data-testid="evolution-changes-column"
          >
            <p className={styles.changesColumnLabel}>{changeMetric.label}</p>
            <p className={styles.changesColumnValue}>{changeMetric.value}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
