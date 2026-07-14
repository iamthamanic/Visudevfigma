/**
 * Pill sub-tabs for DiagnosticsView (Security default per Figma Diagnosen).
 */

import styles from "../../styles/DiagnosticsView.module.css";

export const DIAGNOSTICS_TABS = [
  { id: "security", label: "Security" },
  { id: "architecture", label: "Architecture" },
  { id: "completeness", label: "Completeness" },
  { id: "complexity", label: "Complexity" },
  { id: "evidence", label: "Evidence" },
] as const;

export type DiagnosticsTabId = (typeof DIAGNOSTICS_TABS)[number]["id"];

interface DiagnosticsSubTabsProps {
  activeTab: DiagnosticsTabId;
  onSelectTab: (tab: DiagnosticsTabId) => void;
}

export function DiagnosticsSubTabs({
  activeTab,
  onSelectTab,
}: DiagnosticsSubTabsProps): JSX.Element {
  return (
    <div className={styles.subTabs} role="tablist" aria-label="Diagnose-Kategorien">
      {DIAGNOSTICS_TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={activeTab === tab.id}
          className={`${styles.subTab} ${activeTab === tab.id ? styles.subTabActive : ""}`}
          onClick={() => onSelectTab(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
