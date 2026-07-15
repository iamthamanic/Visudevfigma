/**
 * Severity / area / search chrome above the Diagnostics findings table (Wave 5).
 * Location: src/modules/blueprint/components/diagnostics/
 */

import styles from "../../styles/DiagnosticsView.module.css";

export interface DiagnosticsFindingsFilterBarProps {
  severity: string;
  area: string;
  search: string;
  areas: string[];
  onSeverityChange: (value: string) => void;
  onAreaChange: (value: string) => void;
  onSearchChange: (value: string) => void;
}

export function DiagnosticsFindingsFilterBar({
  severity,
  area,
  search,
  areas,
  onSeverityChange,
  onAreaChange,
  onSearchChange,
}: DiagnosticsFindingsFilterBarProps): JSX.Element {
  return (
    <div className={styles.findingsFilterBar} data-testid="findings-filter-bar">
      <label className={styles.findingsFilterLabel}>
        <span className={styles.srOnly}>Schweregrad</span>
        <select
          className={styles.findingsFilterSelect}
          data-testid="findings-severity-filter"
          value={severity}
          onChange={(event) => onSeverityChange(event.target.value)}
        >
          <option value="all">Alle Schweregrade</option>
          <option value="critical">Kritisch</option>
          <option value="high">Hoch</option>
          <option value="medium">Mittel</option>
          <option value="low">Niedrig</option>
          <option value="info">Info</option>
        </select>
      </label>
      <label className={styles.findingsFilterLabel}>
        <span className={styles.srOnly}>Bereich</span>
        <select
          className={styles.findingsFilterSelect}
          data-testid="findings-area-filter"
          value={area}
          onChange={(event) => onAreaChange(event.target.value)}
        >
          <option value="all">Alle Bereiche</option>
          {areas.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>
      </label>
      <label className={styles.findingsFilterLabelGrow}>
        <span className={styles.srOnly}>Suche Findings</span>
        <input
          type="search"
          className={styles.findingsFilterSearch}
          data-testid="findings-search"
          placeholder="Suche Findings…"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>
    </div>
  );
}
