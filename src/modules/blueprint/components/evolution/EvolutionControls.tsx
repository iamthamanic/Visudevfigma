/**
 * Sidebar controls for EvolutionView — snapshot selectors, timeline, and diff legend.
 */

import type { GitSummary, SoftwareGraphSnapshot } from "../../types";
import styles from "../../styles/EvolutionView.module.css";

export interface EvolutionControlsProps {
  snapshots: SoftwareGraphSnapshot[];
  gitSummary: GitSummary | null;
  gitLoadError: string | null;
  baseSnapshotId: string | null;
  targetSnapshotId: string | null;
  identical: boolean;
  condensed: boolean;
  onSelectBase: (snapshotId: string) => void;
  onSelectTarget: (snapshotId: string) => void;
}

export function EvolutionControls({
  snapshots,
  gitSummary,
  gitLoadError,
  baseSnapshotId,
  targetSnapshotId,
  identical,
  condensed,
  onSelectBase,
  onSelectTarget,
}: EvolutionControlsProps) {
  const gitUnavailable = gitSummary != null && !gitSummary.initialized;

  return (
    <aside className={styles.sidebar} aria-label="Evolution-Steuerung">
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Vergleich</h3>
        {snapshots.length < 2 ? (
          <p className={styles.emptyControls}>
            Mindestens zwei Snapshots nötig. Führe weitere Blueprint-Analysen aus.
          </p>
        ) : (
          <>
            <label className={styles.fieldLabel}>
              Basis
              <select
                className={styles.select}
                value={baseSnapshotId ?? ""}
                onChange={(event) => onSelectBase(event.target.value)}
              >
                {snapshots.map((snapshot) => (
                  <option key={snapshot.id} value={snapshot.id}>
                    {snapshot.label}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.fieldLabel}>
              Ziel
              <select
                className={styles.select}
                value={targetSnapshotId ?? ""}
                onChange={(event) => onSelectTarget(event.target.value)}
              >
                {snapshots.map((snapshot) => (
                  <option key={snapshot.id} value={snapshot.id}>
                    {snapshot.label}
                  </option>
                ))}
              </select>
            </label>
          </>
        )}
        {identical ? (
          <p className={styles.hint}>Keine Unterschiede zwischen den Snapshots.</p>
        ) : null}
        {condensed ? (
          <p className={styles.hint}>
            Große Diff — Anzeige ist gekürzt (max. 500 Knoten pro Kategorie).
          </p>
        ) : null}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Timeline</h3>
        {snapshots.length === 0 ? (
          <p className={styles.emptyControls}>Keine Snapshots vorhanden.</p>
        ) : (
          <ul className={styles.timeline}>
            {snapshots.map((snapshot) => (
              <li key={snapshot.id} className={styles.timelineItem}>
                <span className={styles.timelineLabel}>{snapshot.label}</span>
                <span className={styles.timelineMeta}>{snapshot.capturedAt.slice(0, 10)}</span>
              </li>
            ))}
          </ul>
        )}
        {gitSummary?.commits.length ? (
          <ul className={styles.timeline}>
            {gitSummary.commits.slice(0, 8).map((commit) => (
              <li key={commit.sha} className={styles.timelineItem}>
                <span className={styles.timelineLabel}>{commit.subject}</span>
                <span className={styles.timelineMeta}>{commit.sha.slice(0, 8)}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Legende</h3>
        <ul className={styles.legend}>
          <li>
            <span className={styles.legendSwatchAdded} /> Hinzugefügt
          </li>
          <li>
            <span className={styles.legendSwatchRemoved} /> Entfernt
          </li>
          <li>
            <span className={styles.legendSwatchChanged} /> Geändert
          </li>
        </ul>
      </section>

      {gitLoadError ? (
        <section className={styles.section}>
          <p className={styles.hint}>{gitLoadError}</p>
        </section>
      ) : null}

      {gitSummary?.warnings?.length ? (
        <section className={styles.section}>
          <p className={styles.hint}>Git teilweise gelesen: {gitSummary.warnings.join("; ")}</p>
        </section>
      ) : null}

      {gitUnavailable ? (
        <section className={styles.section}>
          <p className={styles.emptyControls}>
            Kein Git-Repository im Projektordner. Evolution nutzt nur gespeicherte Snapshots.
          </p>
        </section>
      ) : null}
      {gitSummary?.shallow ? (
        <section className={styles.section}>
          <p className={styles.hint}>Shallow Clone — Commit-Historie kann unvollständig sein.</p>
        </section>
      ) : null}
    </aside>
  );
}
