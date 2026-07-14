/**
 * Persistent Blueprint footer with graph counters and refresh.
 * Location: src/modules/blueprint/components/
 */

import { RefreshCw } from "lucide-react";
import type { BlueprintGraphStats } from "./blueprint-graph-stats.js";
import styles from "../styles/BlueprintFooterStatusBar.module.css";

interface BlueprintFooterStatusBarProps {
  stats: BlueprintGraphStats;
  freshnessLabel: string;
  onRefresh: () => void;
  refreshDisabled?: boolean;
}

function formatCount(value: number): string {
  if (!Number.isFinite(value) || value < 0) return "0";
  return value.toLocaleString("de-DE");
}

export function BlueprintFooterStatusBar({
  stats,
  freshnessLabel,
  onRefresh,
  refreshDisabled = false,
}: BlueprintFooterStatusBarProps): JSX.Element {
  return (
    <footer className={styles.root}>
      <div className={styles.metrics}>
        <span>{formatCount(stats.moduleCount)} Module</span>
        <span className={styles.separator}>│</span>
        <span>{formatCount(stats.fileCount)} Dateien</span>
        <span className={styles.separator}>│</span>
        <span>{formatCount(stats.dependencyCount)} Abhängigkeiten</span>
      </div>

      <div className={styles.actions}>
        <span className={styles.freshness}>Aktualisiert {freshnessLabel}</span>
        <button
          type="button"
          className={styles.refreshButton}
          onClick={onRefresh}
          disabled={refreshDisabled}
          aria-label="Blueprint-Daten aktualisieren"
        >
          <RefreshCw className={styles.icon} aria-hidden="true" />
        </button>
      </div>
    </footer>
  );
}
