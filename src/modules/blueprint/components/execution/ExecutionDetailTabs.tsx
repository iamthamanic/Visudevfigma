/**
 * Tabbed detail panel for selected execution step (Figma Ausführung detail tabs).
 * Übersicht shows Payload REQUEST/RESPONSE when present (Wave 4 default capture path).
 */

import { useState } from "react";
import type { SoftwareGraphEvidence, SoftwareGraphNodeKind } from "../../types";
import { useCopyFeedback } from "../../hooks/useCopyFeedback.js";
import styles from "../../styles/ExecutionView.module.css";
import { ExecutionDetailEvidenceBlock } from "./ExecutionDetailEvidenceBlock.js";
import {
  filterExecutionEvidenceByTab,
  resolveExecutionTabContent,
  type ExecutionDetailTabId,
} from "./executionDetailEvidence.js";
import { splitPayloadEvidence } from "./split-payload-evidence.js";

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
  const overviewPayload = filterExecutionEvidenceByTab("payload", selectedEvidence);
  const { request: requestBlock, response: responseBlock } = splitPayloadEvidence(overviewPayload);

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
          <>
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
                <dd>{selectedEvidence.length}</dd>
              </div>
            </dl>
            {requestBlock.length > 0 ? (
              <div data-testid="execution-payload">
                <ExecutionDetailEvidenceBlock
                  tab="payload"
                  titleOverride="PAYLOAD (REQUEST)"
                  tabEvidence={requestBlock}
                  copyStatus={copyStatus}
                  onCopy={() =>
                    void copyText(requestBlock.map((entry) => entry.excerpt).join("\n\n"))
                  }
                />
              </div>
            ) : null}
            {responseBlock.length > 0 ? (
              <div data-testid="execution-response">
                <ExecutionDetailEvidenceBlock
                  tab="payload"
                  titleOverride="RESPONSE"
                  tabEvidence={responseBlock}
                  copyStatus={copyStatus}
                  onCopy={() =>
                    void copyText(responseBlock.map((entry) => entry.excerpt).join("\n\n"))
                  }
                />
              </div>
            ) : null}
          </>
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
