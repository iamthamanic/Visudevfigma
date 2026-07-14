/**
 * Right Inspektor for ExecutionView — selected step evidence summary.
 */

import type { SoftwareGraphEvidence, SoftwareGraphNodeKind } from "../../types";
import { InspectorPanel } from "../ui/InspectorPanel.js";
import styles from "../../styles/ExecutionView.module.css";

const STEP_KIND_LABELS: Partial<Record<SoftwareGraphNodeKind, string>> = {
  route: "Route",
  file: "Handler",
  service: "Service",
  repository: "Repository",
  table: "Database",
  external: "External",
};

export interface ExecutionInspectorProps {
  stepLabel: string | null;
  stepKind: SoftwareGraphNodeKind | null;
  selectedEvidence: SoftwareGraphEvidence[];
}

export function ExecutionInspector({
  stepLabel,
  stepKind,
  selectedEvidence,
}: ExecutionInspectorProps): JSX.Element {
  if (!stepLabel) {
    return (
      <InspectorPanel
        title="Keine Auswahl"
        emptyMessage="Wähle einen Schritt, um Evidence und Metadaten zu sehen."
      />
    );
  }

  const kindLabel = stepKind ? (STEP_KIND_LABELS[stepKind] ?? stepKind) : "—";

  return (
    <InspectorPanel
      title={stepLabel}
      subtitle={kindLabel}
      sections={[
        {
          id: "evidence",
          title: "Evidence",
          content:
            selectedEvidence.length === 0 ? (
              <p className={styles.emptyControls}>Keine Evidence für diesen Schritt.</p>
            ) : (
              <ul className={styles.evidenceList}>
                {selectedEvidence.map((evidence) => (
                  <li key={evidence.id} className={styles.evidenceItem}>
                    <p className={styles.evidenceMeta}>
                      {evidence.filePath}:{evidence.line} · {evidence.kind}
                    </p>
                    <pre className={styles.evidenceExcerpt}>{evidence.excerpt}</pre>
                  </li>
                ))}
              </ul>
            ),
        },
      ]}
    />
  );
}
