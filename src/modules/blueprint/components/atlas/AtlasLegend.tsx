/**
 * AtlasLegend — cluster kind colors for 2D/3D atlas views.
 */

import styles from "../../styles/AtlasView.module.css";

const LEGEND_ITEMS = [
  { id: "frontend", label: "Frontend", kind: "module" },
  { id: "backend", label: "Backend", kind: "service" },
  { id: "data", label: "Data", kind: "table" },
  { id: "external", label: "External", kind: "external" },
];

export function AtlasLegend(): JSX.Element {
  return (
    <div className={styles.legend} aria-label="Atlas-Legende">
      {LEGEND_ITEMS.map((item) => (
        <span key={item.id} className={styles.legendItem} data-kind={item.kind}>
          {item.label}
        </span>
      ))}
    </div>
  );
}
