/**
 * Left controls for DependenciesView — Beziehungstypen chips and Top-Abhängigkeiten summary.
 */

import { ViewSectionTitle } from "../ui/ViewSectionTitle.js";
import { RelationshipChip } from "../ui/RelationshipChip.js";
import { RELATIONSHIP_KINDS, type RelationshipKind } from "../ui/blueprint-relationship-tokens.js";
import { RELATIONSHIP_LABELS, type DependencyEdgeKind } from "./_projection.constants.js";
import styles from "../../styles/DependenciesView.module.css";

export interface TopDependencyCount {
  kind: DependencyEdgeKind;
  count: number;
}

export interface DependenciesControlsProps {
  visibleEdgeKinds: Set<DependencyEdgeKind>;
  topDependencies: TopDependencyCount[];
  onToggleEdgeKind: (kind: DependencyEdgeKind) => void;
  onResetFilters: () => void;
}

export function DependenciesControls({
  visibleEdgeKinds,
  topDependencies,
  onToggleEdgeKind,
  onResetFilters,
}: DependenciesControlsProps): JSX.Element {
  const sortedTop = [...topDependencies].sort((a, b) => b.count - a.count);

  return (
    <aside className={styles.controls} aria-label="Abhängigkeiten-Steuerung">
      <section className={styles.section}>
        <ViewSectionTitle>Beziehungstypen</ViewSectionTitle>
        <div className={styles.chipGrid}>
          {RELATIONSHIP_KINDS.map((kind) => (
            <RelationshipChip
              key={kind}
              kind={kind as RelationshipKind}
              active={visibleEdgeKinds.has(kind as DependencyEdgeKind)}
              onToggle={() => onToggleEdgeKind(kind as DependencyEdgeKind)}
            />
          ))}
        </div>
        <button
          type="button"
          className={`btn btn-sm btn-ghost ${styles.resetButton}`}
          onClick={onResetFilters}
        >
          Filter zurücksetzen
        </button>
      </section>

      <section className={styles.section}>
        <ViewSectionTitle>Top Abhängigkeiten</ViewSectionTitle>
        {sortedTop.length === 0 ? (
          <p className={styles.emptyControls}>Keine Abhängigkeits-Kanten im Graph.</p>
        ) : (
          <ul className={styles.topDepsList}>
            {sortedTop.map(({ kind, count }) => (
              <li key={kind} className={styles.topDepsItem}>
                <span className={styles.topDepsKind} data-kind={kind}>
                  {RELATIONSHIP_LABELS[kind]}
                </span>
                <span className={styles.topDepsCount}>{count}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
