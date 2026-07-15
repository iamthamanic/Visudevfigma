/**
 * Tabbed detail panel for selected execution step (Figma Ausführung detail tabs).
 */

import { useState } from "react";
import type { SoftwareGraphEvidence, SoftwareGraphNodeKind } from "../../types";
import { useCopyFeedback } from "../../hooks/useCopyFeedback.js";
import styles from "../../styles/ExecutionView.module.css";
import { ExecutionDetailEvidenceBlock } from "./ExecutionDetailEvidenceBlock.js";
import {
  resolveExecutionTabContent,
  type ExecutionDetailTabId,
} from "./executionDetailEvidence.js";

const DETAIL_TABS = [
  { id: "overview", label: "Übersicht" },
  { id: "payload", label: "Payload" },
  { id: "headers", label: "Headers" },
  { id: "logs", label: "Logs" },
  { id: "stacktrace", label: "Stacktrace" },
  { id: "tags", label: "Tags" },
  { id: "code", label: "Code-Standort" },
] as const satisfies ReadonlyArray<{ id: ExecutionDetailTabId; label: string }>;

const STEP_KIND_LABELS: Partial<Record<SoftwareGraphNodeKind, string>> = {
  route: "Route",
  file: "Handler",
  service: "Service",
  repository: "Repository",
  table: "Database",
  external: "External",
};

export interface ExecutionDetailTabsProps {
  stepLabel: string | null;
  stepKind: SoftwareGraphNodeKind | null;
  selectedEvidence: SoftwareGraphEvidence[];
}

export function ExecutionDetailTabs({
  stepLabel,
  stepKind,
  selectedEvidence,
}: ExecutionDetailTabsProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<ExecutionDetailTabId>("overview");
  const { copyStatus, copyText } = useCopyFeedback();

  if (!stepLabel) {
    return (
      <div className={styles.detailEmpty}>
        <p>Wähle einen Schritt, um Details anzuzeigen.</p>
      </div>
    );
  }

  const { tabEvidence, resolvedTabText } = resolveExecutionTabContent(activeTab, selectedEvidence);

  return (
    <div className={styles.detailPanel}>
      <div className={styles.tabList} role="tablist" aria-label="Schritt-Details">
        {DETAIL_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeTab === tab.id}
            className={`${styles.tabButton} ${activeTab === tab.id ? styles.tabButtonActive : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className={styles.tabPanel} role="tabpanel">
        {activeTab === "overview" ? (
          <dl className={styles.overviewList}>
            <div className={styles.overviewRow}>
              <dt>Schritt</dt>
              <dd>{stepLabel}</dd>
            </div>
            <div className={styles.overviewRow}>
              <dt>Typ</dt>
              <dd>{stepKind ? (STEP_KIND_LABELS[stepKind] ?? stepKind) : "—"}</dd>
            </div>
            <div className={styles.overviewRow}>
              <dt>Status</dt>
              <dd>Erfolgreich</dd>
            </div>
            <div className={styles.overviewRow}>
              <dt>Evidence</dt>
              <dd>{Math.max(selectedEvidence.length, resolvedTabText ? 1 : 0)}</dd>
            </div>
          </dl>
        ) : null}

        {activeTab !== "overview" && !resolvedTabText ? (
          <p className={styles.emptyControls}>Keine Daten für diesen Tab.</p>
        ) : null}

        {activeTab !== "overview" && resolvedTabText ? (
          <ExecutionDetailEvidenceBlock
            tab={activeTab}
            tabEvidence={tabEvidence}
            copyStatus={copyStatus}
            onCopy={() => void copyText(resolvedTabText)}
          />
        ) : null}
      </div>
    </div>
  );
}
