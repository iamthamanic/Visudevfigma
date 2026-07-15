/**
 * Renders one execution detail tab panel with copy action.
 */

import type { SoftwareGraphEvidence } from "../../types";
import type { CopyFeedbackStatus } from "../../hooks/useCopyFeedback.js";
import styles from "../../styles/ExecutionView.module.css";
import type { ExecutionDetailTabId } from "./executionDetailEvidence.js";

export interface ExecutionDetailEvidenceBlockProps {
  tab: ExecutionDetailTabId;
  tabEvidence: SoftwareGraphEvidence[];
  copyStatus: CopyFeedbackStatus;
  onCopy: () => void;
  titleOverride?: string;
}

function copyButtonLabel(status: CopyFeedbackStatus): string {
  if (status === "copied") return "Kopiert";
  if (status === "error") return "Kopieren fehlgeschlagen";
  return "Kopieren";
}

export function ExecutionDetailEvidenceBlock({
  tab,
  tabEvidence,
  copyStatus,
  onCopy,
  titleOverride,
}: ExecutionDetailEvidenceBlockProps): JSX.Element {
  return (
    <div
      className={styles.evidenceBlock}
      data-testid={
        tab === "payload"
          ? "execution-detail-tab-payload"
          : tab === "headers"
            ? "execution-detail-tab-headers"
            : tab === "logs"
              ? "execution-detail-tab-logs"
              : undefined
      }
    >
      <div className={styles.evidenceBlockHeader}>
        <span className={styles.evidenceBlockTitle}>
          {titleOverride ?? (tab === "payload" ? "Request / Response" : tab.toUpperCase())}
        </span>
        <button type="button" className={styles.copyButton} onClick={onCopy}>
          {copyButtonLabel(copyStatus)}
        </button>
      </div>
      <ul className={styles.evidenceList}>
        {tabEvidence.map((evidence) => (
          <li key={evidence.id} className={styles.evidenceItem}>
            <p className={styles.evidenceMeta}>
              {evidence.filePath}:{evidence.line} · {evidence.kind}
            </p>
            <pre className={styles.evidenceExcerpt}>{evidence.excerpt}</pre>
          </li>
        ))}
      </ul>
    </div>
  );
}
