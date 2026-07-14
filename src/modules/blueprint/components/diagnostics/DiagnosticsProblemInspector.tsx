/**
 * Problem-Inspektor for selected finding — severity, rule metadata, code excerpt.
 */

import type { BlueprintFinding, CodeFact } from "../../types";
import { InspectorPanel } from "../ui/InspectorPanel.js";
import { StatusBadge } from "../ui/StatusBadge.js";
import { SEVERITY_LABELS, severityBadgeVariant } from "./diagnostics-severity.js";
import styles from "../../styles/DiagnosticsView.module.css";

interface DiagnosticsProblemInspectorProps {
  finding: BlueprintFinding | null;
  facts: CodeFact[];
}

export function DiagnosticsProblemInspector({
  finding,
  facts,
}: DiagnosticsProblemInspectorProps): JSX.Element {
  if (!finding) {
    return (
      <InspectorPanel
        title="Keine Auswahl"
        emptyMessage="Wähle ein Finding, um Details und Evidence zu sehen."
      />
    );
  }

  const factMap = new Map(facts.map((fact) => [fact.id, fact]));
  const evidenceFacts = finding.evidenceFactIds
    .map((id) => factMap.get(id))
    .filter((fact): fact is CodeFact => fact != null);

  return (
    <InspectorPanel
      title={finding.message}
      subtitle={finding.ruleId}
      badges={
        <StatusBadge
          variant={severityBadgeVariant(finding.severity)}
          label={SEVERITY_LABELS[finding.severity]}
        />
      }
      sections={[
        {
          id: "details",
          title: "Details",
          content: (
            <dl className={styles.detailList}>
              <div className={styles.detailRow}>
                <dt>Erwartet</dt>
                <dd>{finding.expectedState}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Gefunden</dt>
                <dd>{finding.actualState}</dd>
              </div>
              <div className={styles.detailRow}>
                <dt>Confidence</dt>
                <dd>{finding.confidence}%</dd>
              </div>
              {finding.remediation ? (
                <div className={styles.detailRow}>
                  <dt>Lösung</dt>
                  <dd>{finding.remediation}</dd>
                </div>
              ) : null}
            </dl>
          ),
        },
        {
          id: "evidence",
          title: "Evidence",
          content:
            evidenceFacts.length === 0 ? (
              <p className={styles.emptyControls}>Keine Evidence verknüpft.</p>
            ) : (
              <ul className={styles.evidenceList}>
                {evidenceFacts.map((fact) => (
                  <li key={fact.id} className={styles.evidenceItem}>
                    <p className={styles.evidenceMeta}>
                      {fact.filePath}:{fact.line}
                    </p>
                    <pre className={styles.evidenceSnippet}>{fact.snippet}</pre>
                  </li>
                ))}
              </ul>
            ),
        },
      ]}
    />
  );
}
