/**
 * Horizontal snapshot selector cards with base/target markers.
 */

import { Check } from "lucide-react";
import type { SoftwareGraphSnapshot } from "../../types";
import { ViewSectionTitle } from "../ui/ViewSectionTitle.js";
import { displayText, formatSnapshotDate } from "./evolution-display.js";
import styles from "../../styles/EvolutionView.module.css";

interface EvolutionSnapshotCardsProps {
  snapshots: SoftwareGraphSnapshot[];
  baseSnapshotId: string | null;
  targetSnapshotId: string | null;
  onSelectBase: (snapshotId: string) => void;
  onSelectTarget: (snapshotId: string) => void;
}

export function EvolutionSnapshotCards({
  snapshots,
  baseSnapshotId,
  targetSnapshotId,
  onSelectTarget,
}: EvolutionSnapshotCardsProps): JSX.Element {
  return (
    <section className={styles.snapshotRow} aria-label="Snapshot-Auswahl">
      <ViewSectionTitle>Atlas Snapshots</ViewSectionTitle>
      {snapshots.length === 0 ? (
        <p className={styles.emptyControls}>Keine Snapshots vorhanden.</p>
      ) : (
        <ul className={styles.snapshotList}>
          {snapshots.map((snapshot) => {
            const isTarget = snapshot.id === targetSnapshotId;
            const isBase = snapshot.id === baseSnapshotId;
            return (
              <li key={snapshot.id}>
                <button
                  type="button"
                  className={`${styles.snapshotCard} ${isTarget ? styles.snapshotCardSelected : ""}`}
                  aria-pressed={isTarget}
                  onClick={() => onSelectTarget(snapshot.id)}
                >
                  <span className={styles.snapshotCardHeader}>
                    <span className={styles.snapshotLabel}>{displayText(snapshot.label)}</span>
                    {isTarget ? (
                      <Check className={styles.snapshotCheck} aria-hidden="true" />
                    ) : null}
                  </span>
                  <span className={styles.snapshotMeta}>
                    {formatSnapshotDate(snapshot.capturedAt)}
                  </span>
                  {isBase ? <span className={styles.snapshotBadge}>Basis</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
