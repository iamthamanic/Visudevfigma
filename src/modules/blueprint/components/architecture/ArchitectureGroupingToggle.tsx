/**
 * Domains | Layers | Modules pill toggle for ArchitectureView grouping mode.
 */

import {
  ARCHITECTURE_GROUPING_MODES,
  GROUPING_MODE_LABELS,
  type ArchitectureGroupingMode,
} from "./architecture-grouping.js";
import styles from "../../styles/ArchitectureView.module.css";

interface ArchitectureGroupingToggleProps {
  mode: ArchitectureGroupingMode;
  onSelectMode: (mode: ArchitectureGroupingMode) => void;
}

export function ArchitectureGroupingToggle({
  mode,
  onSelectMode,
}: ArchitectureGroupingToggleProps): JSX.Element {
  return (
    <div className={styles.groupingToggle} role="tablist" aria-label="Architektur-Gruppierung">
      {ARCHITECTURE_GROUPING_MODES.map((groupingMode) => (
        <button
          key={groupingMode}
          type="button"
          role="tab"
          aria-selected={mode === groupingMode}
          className={`${styles.groupingTab} ${mode === groupingMode ? styles.groupingTabActive : ""}`}
          onClick={() => onSelectMode(groupingMode)}
        >
          {GROUPING_MODE_LABELS[groupingMode]}
        </button>
      ))}
    </div>
  );
}
