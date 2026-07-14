/**
 * Sidebar controls for DependenciesView — edge kind filters and evidence inspector.
 */

import type { SoftwareGraphEdge, SoftwareGraphEvidence } from "../../types";
import {
  DEPENDENCY_EDGE_KINDS,
  DEPENDENCY_EDGE_LABELS,
  type DependencyEdgeKind,
} from "./_projection.constants.js";
import styles from "../../styles/DependenciesView.module.css";

export interface DependenciesControlsProps {
  visibleEdgeKinds: Set<DependencyEdgeKind>;
  selectedEdge: SoftwareGraphEdge | null;
  selectedEvidence: SoftwareGraphEvidence[];
  onToggleEdgeKind: (kind: DependencyEdgeKind) => void;
  onResetFilters: () => void;
}

export function DependenciesControls({
  visibleEdgeKinds,
  selectedEdge,
  selectedEvidence,
  onToggleEdgeKind,
  onResetFilters,
}: DependenciesControlsProps) {
  return (
    <aside className={styles.sidebar} aria-label="Abhängigkeiten-Steuerung">
      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Kantenfilter</h3>
        <div className={styles.filterGrid}>
          {DEPENDENCY_EDGE_KINDS.map((kind) => (
            <label key={kind} className={styles.filterLabel}>
              <input
                type="checkbox"
                checked={visibleEdgeKinds.has(kind)}
                onChange={() => onToggleEdgeKind(kind)}
              />
              {DEPENDENCY_EDGE_LABELS[kind]}
            </label>
          ))}
        </div>
        <button type="button" className={styles.resetButton} onClick={onResetFilters}>
          Filter zurücksetzen
        </button>
      </section>

      <section className={styles.section}>
        <h3 className={styles.sectionTitle}>Evidence</h3>
        {!selectedEdge ? (
          <p className={styles.emptyControls}>Kante im Graph auswählen, um Evidence zu sehen.</p>
        ) : selectedEvidence.length === 0 ? (
          <p className={styles.emptyControls}>
            Keine Evidence für <span className={styles.edgeKind}>{selectedEdge.kind}</span>.
          </p>
        ) : (
          <ul className={styles.evidenceList}>
            {selectedEvidence.map((item) => (
              <li key={item.id} className={styles.evidenceItem}>
                <p className={styles.evidenceMeta}>
                  {item.filePath}:{item.line} · {item.kind}
                </p>
                <pre className={styles.evidenceExcerpt}>{item.excerpt}</pre>
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}
