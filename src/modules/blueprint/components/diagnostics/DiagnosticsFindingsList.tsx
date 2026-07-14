/**
 * Findings list with severity badges; drives Problem-Inspektor selection.
 */

import type { BlueprintFinding } from "../../types";
import { ViewSectionTitle } from "../ui/ViewSectionTitle.js";
import { StatusBadge } from "../ui/StatusBadge.js";
import { SEVERITY_LABELS, severityBadgeVariant } from "./diagnostics-severity.js";
import styles from "../../styles/DiagnosticsView.module.css";

interface DiagnosticsFindingsListProps {
  findings: BlueprintFinding[];
  selectedFindingId: string | null;
  onSelectFinding: (id: string | null) => void;
}

export function DiagnosticsFindingsList({
  findings,
  selectedFindingId,
  onSelectFinding,
}: DiagnosticsFindingsListProps): JSX.Element {
  return (
    <aside className={styles.controls} aria-label="Findings">
      <ViewSectionTitle>Findings</ViewSectionTitle>
      {findings.length === 0 ? (
        <p className={styles.emptyControls}>Keine Findings für diese Auswahl.</p>
      ) : (
        <ul className={styles.findingsList}>
          {findings.map((finding) => {
            const isActive = finding.id === selectedFindingId;
            return (
              <li key={finding.id}>
                <button
                  type="button"
                  className={`${styles.findingButton} ${isActive ? styles.findingButtonActive : ""}`}
                  aria-pressed={isActive}
                  onClick={() =>
                    onSelectFinding(finding.id === selectedFindingId ? null : finding.id)
                  }
                >
                  <StatusBadge
                    variant={severityBadgeVariant(finding.severity)}
                    label={SEVERITY_LABELS[finding.severity]}
                  />
                  <span className={styles.findingMessage}>{finding.message}</span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );
}
