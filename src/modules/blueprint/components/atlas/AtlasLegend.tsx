/**
 * AtlasLegend — cluster kind colors for 2D/3D atlas views (7 reference types).
 */

import styles from "../../styles/AtlasView.module.css";

const LEGEND_ITEMS = [
  { id: "frontend", label: "Frontend", kind: "module" },
  { id: "backend", label: "Backend", kind: "service" },
  { id: "worker", label: "Worker", kind: "worker" },
  { id: "data", label: "Daten", kind: "table" },
  { id: "storage", label: "Speicher", kind: "storage" },
  { id: "external", label: "Externe", kind: "external" },
  { id: "security", label: "Sicherheit", kind: "security" },
];

export function AtlasLegend(): JSX.Element {
  return (
    <div className={styles.legend} aria-label="Atlas-Legende" data-testid="atlas-legend">
      {LEGEND_ITEMS.map((item) => (
        <span
          key={item.id}
          className={styles.legendItem}
          data-kind={item.kind}
          data-testid="atlas-legend-item"
        >
          <span className={styles.legendDot} aria-hidden="true" />
          {item.label}
        </span>
      ))}
    </div>
  );
}
