/**
 * Empty-selection inspector panel for DependenciesView top dependency counts.
 */

import { InspectorPanel } from "../ui/InspectorPanel.js";
import type { DependencyKindCount } from "./_projection.js";
import { RELATIONSHIP_LABELS } from "./_projection.constants.js";
import styles from "../../styles/DependenciesView.module.css";

export interface DependenciesEmptyInspectorProps {
  topDependencies: DependencyKindCount[];
}

export function DependenciesEmptyInspector({
  topDependencies,
}: DependenciesEmptyInspectorProps): JSX.Element {
  return (
    <div data-testid="dependency-inspector">
      <InspectorPanel
        title="Keine Auswahl"
        emptyMessage="Wähle einen Knoten im Graph, um Details zu sehen."
        sections={[
          {
            id: "top-deps",
            title: "Top Abhängigkeiten",
            content:
              topDependencies.length === 0 ? (
                <p className={styles.emptyControls}>Keine Kanten im Graph.</p>
              ) : (
                <ul className={styles.topDepsList}>
                  {topDependencies.map((dependencyCount) => (
                    <li key={dependencyCount.kind} className={styles.topDepsItem}>
                      <span className={styles.topDepsKind} data-kind={dependencyCount.kind}>
                        {RELATIONSHIP_LABELS[dependencyCount.kind]}
                      </span>
                      <span className={styles.topDepsCount}>{dependencyCount.count}</span>
                    </li>
                  ))}
                </ul>
              ),
          },
        ]}
      />
    </div>
  );
}
