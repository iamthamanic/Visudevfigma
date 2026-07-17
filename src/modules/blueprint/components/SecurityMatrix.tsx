/**
 * SecurityMatrix — tabellarische Route × Controls Übersicht für Blueprint.
 * Wave 5: polished Status column badges (OK / Warnung / Hoch / Kritisch).
 * Location: src/modules/blueprint/components/SecurityMatrix.tsx
 */

import type { SecurityMatrixRow } from "../types";
import { cellSymbol } from "../types";
import { matrixRowStatus } from "./diagnostics/matrix-row-status.js";
import { StatusBadge } from "./ui/StatusBadge.js";
import styles from "../styles/SecurityMatrix.module.css";

interface SecurityMatrixProps {
  rows: SecurityMatrixRow[];
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
}

export function SecurityMatrix({ rows, selectedRouteId, onSelectRoute }: SecurityMatrixProps) {
  if (rows.length === 0) {
    return <p className={styles.empty}>Keine API-Routes erkannt.</p>;
  }

  return (
    <div className={styles.wrap} data-testid="security-matrix">
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Route</th>
            <th>Auth</th>
            <th>Role</th>
            <th>Validation</th>
            <th>Rate Limit</th>
            <th>DB</th>
            <th>Audit</th>
            <th>Findings</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const status = matrixRowStatus(row);
            return (
              <tr
                key={row.routeId}
                className={row.routeId === selectedRouteId ? styles.selectedRow : undefined}
                data-testid="security-matrix-row"
              >
                <td>
                  <button
                    type="button"
                    className={styles.routeButton}
                    onClick={() => onSelectRoute(row.routeId)}
                    aria-pressed={row.routeId === selectedRouteId}
                  >
                    <span className={styles.method}>{row.method}</span>
                    <code className={styles.path}>{row.path}</code>
                  </button>
                </td>
                <td className={stateClass(row.auth.state)}>{cellSymbol(row.auth.state)}</td>
                <td className={stateClass(row.role.state)}>{cellSymbol(row.role.state)}</td>
                <td className={stateClass(row.validation.state)}>
                  {cellSymbol(row.validation.state)}
                </td>
                <td className={stateClass(row.rateLimit.state)}>
                  {cellSymbol(row.rateLimit.state)}
                </td>
                <td className={stateClass(row.db.state)}>{cellSymbol(row.db.state)}</td>
                <td className={stateClass(row.audit.state)}>{cellSymbol(row.audit.state)}</td>
                <td>{row.findingCount}</td>
                <td>
                  <StatusBadge
                    variant={status.variant}
                    label={status.label}
                    testId="matrix-status-badge"
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function stateClass(state: SecurityMatrixRow["auth"]["state"]): string {
  if (state === "confirmed") return styles.stateConfirmed;
  if (state === "missing" || state === "contradictory") return styles.stateMissing;
  if (state === "partial" || state === "weak") return styles.statePartial;
  return styles.stateUnknown;
}
