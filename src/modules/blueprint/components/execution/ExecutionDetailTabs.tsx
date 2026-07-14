/**
 * Tabbed detail panel for selected execution step (Figma Ausführung detail tabs).
 */

import { useState } from "react";
import type { SoftwareGraphEvidence, SoftwareGraphNodeKind } from "../../types";
import styles from "../../styles/ExecutionView.module.css";

const DETAIL_TABS = [
  { id: "overview", label: "Übersicht" },
  { id: "payload", label: "Payload" },
  { id: "headers", label: "Headers" },
  { id: "logs", label: "Logs" },
  { id: "stacktrace", label: "Stacktrace" },
  { id: "tags", label: "Tags" },
  { id: "code", label: "Code-Standort" },
] as const;

type DetailTabId = (typeof DETAIL_TABS)[number]["id"];

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

function filterEvidenceByTab(
  tab: DetailTabId,
  evidence: SoftwareGraphEvidence[],
): SoftwareGraphEvidence[] {
  if (tab === "code") return evidence;
  if (tab === "payload") return evidence.filter((item) => /payload/i.test(item.kind));
  if (tab === "headers") return evidence.filter((item) => /auth|header/i.test(item.kind));
  if (tab === "logs") return evidence.filter((item) => /log/i.test(item.kind));
  if (tab === "stacktrace") return evidence.filter((item) => /stack|trace/i.test(item.kind));
  if (tab === "tags") return evidence.filter((item) => /tag/i.test(item.kind));
  return [];
}

export function ExecutionDetailTabs({
  stepLabel,
  stepKind,
  selectedEvidence,
}: ExecutionDetailTabsProps): JSX.Element {
  const [activeTab, setActiveTab] = useState<DetailTabId>("overview");

  if (!stepLabel) {
    return (
      <div className={styles.detailEmpty}>
        <p>Wähle einen Schritt, um Details anzuzeigen.</p>
      </div>
    );
  }

  const tabEvidence = filterEvidenceByTab(activeTab, selectedEvidence);

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
              <dt>Evidence</dt>
              <dd>{selectedEvidence.length}</dd>
            </div>
          </dl>
        ) : null}

        {activeTab !== "overview" && tabEvidence.length === 0 ? (
          <p className={styles.emptyControls}>Keine Daten für diesen Tab.</p>
        ) : null}

        {activeTab !== "overview" && tabEvidence.length > 0 ? (
          <ul
            className={styles.evidenceList}
            data-testid={activeTab === "payload" ? "execution-detail-tab-payload" : undefined}
          >
            {tabEvidence.map((evidence) => (
              <li key={evidence.id} className={styles.evidenceItem}>
                <p className={styles.evidenceMeta}>
                  {evidence.filePath}:{evidence.line} · {evidence.kind}
                </p>
                <pre className={styles.evidenceExcerpt}>{evidence.excerpt}</pre>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
