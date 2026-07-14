/**
 * Edge-focused inspector panel for DependenciesView evidence display.
 */

import type { SoftwareGraphEdge, SoftwareGraphEvidence } from "../../types";
import { InspectorPanel } from "../ui/InspectorPanel.js";
import styles from "../../styles/DependenciesView.module.css";

export interface DependenciesEdgeInspectorProps {
  sourceLabel: string;
  targetLabel: string;
  edge: SoftwareGraphEdge;
  evidence: SoftwareGraphEvidence[];
}

export function DependenciesEdgeInspector({
  sourceLabel,
  targetLabel,
  edge,
  evidence,
}: DependenciesEdgeInspectorProps): JSX.Element {
  return (
    <div data-testid="dependency-inspector">
      <InspectorPanel
        title={`${sourceLabel} → ${targetLabel}`}
        subtitle={edge.kind}
        sections={[
          {
            id: "evidence",
            title: "Evidence",
            content:
              evidence.length === 0 ? (
                <p className={styles.emptyControls}>Keine Evidence für diese Kante.</p>
              ) : (
                <ul className={styles.evidenceList}>
                  {evidence.map((item) => (
                    <li key={item.id} className={styles.evidenceItem}>
                      <p className={styles.evidenceMeta}>
                        {item.filePath}:{item.line} · {item.kind}
                      </p>
                      <pre className={styles.evidenceExcerpt}>{item.excerpt}</pre>
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
