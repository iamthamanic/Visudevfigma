/**
 * Commit / snapshot Inspektor for EvolutionView diff summary.
 */

import type { GitSummary, SoftwareGraphDiffMetadata, SoftwareGraphSnapshot } from "../../types";
import { InspectorPanel } from "../ui/InspectorPanel.js";
import { displayText, formatCommitSha, formatSnapshotDate } from "./evolution-display.js";
import styles from "../../styles/EvolutionView.module.css";

interface EvolutionInspectorProps {
  targetSnapshot: SoftwareGraphSnapshot | null;
  diff: SoftwareGraphDiffMetadata | null;
  gitSummary: GitSummary | null;
}

export function EvolutionInspector({
  targetSnapshot,
  diff,
  gitSummary,
}: EvolutionInspectorProps): JSX.Element {
  if (!targetSnapshot) {
    return (
      <InspectorPanel
        title="Keine Auswahl"
        emptyMessage="Wähle einen Ziel-Snapshot für Diff-Details."
      />
    );
  }

  const latestCommit = gitSummary?.commits[0];

  return (
    <InspectorPanel
      title={displayText(targetSnapshot.label)}
      subtitle={formatSnapshotDate(targetSnapshot.capturedAt)}
      sections={[
        {
          id: "diff",
          title: "Diff-Statistik",
          content: (
            <dl className={styles.detailList}>
              <div className={styles.detailRow}>
                <dt>Neu</dt>
                <dd>{diff?.addedNodeIds.length ?? 0}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Geändert</dt>
                <dd>{diff?.changedNodeIds.length ?? 0}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Entfernt</dt>
                <dd>{diff?.removedNodeIds.length ?? 0}</dd>
              </div>
            </dl>
          ),
        },
        {
          id: "commit",
          title: "Commit",
          content: latestCommit ? (
            <dl className={styles.detailList}>
              <div className={styles.detailRow}>
                <dt>SHA</dt>
                <dd>{formatCommitSha(latestCommit.sha)}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Betreff</dt>
                <dd>{displayText(latestCommit.subject)}</dd>
              </div>
            </dl>
          ) : (
            <p className={styles.emptyControls}>Keine Git-Commits geladen.</p>
          ),
        },
      ]}
    />
  );
}
