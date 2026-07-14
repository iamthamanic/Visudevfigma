/**
 * Connection type legend for infrastructure topology edges.
 */

import styles from "../../styles/InfrastructureView.module.css";

const LEGEND_ITEMS = [
  { id: "http", label: "HTTP", className: styles.legendHttp },
  { id: "grpc", label: "gRPC", className: styles.legendGrpc },
  { id: "db", label: "DB", className: styles.legendDb },
] as const;

export function InfrastructureConnectionLegend(): JSX.Element {
  return (
    <div className={styles.legend} aria-label="Verbindungs-Legende">
      <span className={styles.legendTitle}>Legende</span>
      <ul className={styles.legendList}>
        {LEGEND_ITEMS.map((item) => (
          <li key={item.id} className={styles.legendItem}>
            <span className={`${styles.legendSwatch} ${item.className}`} aria-hidden="true" />
            {item.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
