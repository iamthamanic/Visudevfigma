/**
 * Access-control v2 Security Matrix for Diagnostics.
 * Why: RLS is not universal — Scope/Tenant/Ownership are the portable columns;
 * technology mechanisms stay in the Inspector (see blueprint-access-control design).
 * Location: src/modules/blueprint/components/AccessControlMatrix.tsx
 */

import type {
  AccessControlMatrixCell,
  AccessControlMatrixRow,
  AccessControlStatus,
} from "../../../lib/visudev/access-control-types";
import { accessControlStatusSymbol } from "../../../lib/visudev/access-control-types";
import type { MatrixControlColumn } from "./diagnostics/access-control-matrix-columns.js";
import { StatusBadge } from "./ui/StatusBadge.js";
import styles from "../styles/SecurityMatrix.module.css";

interface AccessControlMatrixProps {
  rows: AccessControlMatrixRow[];
  selectedRouteId: string | null;
  selectedControl: MatrixControlColumn | null;
  onSelectRoute: (routeId: string) => void;
  onSelectCell: (routeId: string, column: MatrixControlColumn) => void;
}

function acStateClass(status: AccessControlStatus): string {
  if (status === "protected") return styles.stateConfirmed;
  if (status === "missing") return styles.stateMissing;
  if (status === "partial") return styles.statePartial;
  if (status === "unsupported" || status === "not-applicable") return styles.stateUnknown;
  return styles.stateUnknown;
}

function overallBadge(status: AccessControlStatus): {
  variant: "confirmed" | "warning" | "critical" | "missing" | "unknown";
  label: string;
} {
  if (status === "protected" || status === "not-applicable")
    return { variant: "confirmed", label: "OK" };
  if (status === "unsupported") return { variant: "unknown", label: "⊘ N/A" };
  if (status === "partial" || status === "unverified")
    return { variant: "warning", label: "Warnung" };
  if (status === "missing") return { variant: "missing", label: "Hoch" };
  return { variant: "warning", label: "Warnung" };
}

function cellStatus(cell: AccessControlMatrixCell | undefined): AccessControlStatus {
  return cell?.status ?? "unverified";
}

function ControlCell({
  routeId,
  column,
  status,
  selected,
  onSelect,
}: {
  routeId: string;
  column: MatrixControlColumn;
  status: AccessControlStatus;
  selected: boolean;
  onSelect: (routeId: string, column: MatrixControlColumn) => void;
}) {
  return (
    <td className={acStateClass(status)}>
      <button
        type="button"
        className={styles.cellButton}
        aria-pressed={selected}
        data-testid={`ac-matrix-cell-${column}`}
        onClick={() => onSelect(routeId, column)}
      >
        {accessControlStatusSymbol(status)}
      </button>
    </td>
  );
}

export function AccessControlMatrix({
  rows,
  selectedRouteId,
  selectedControl,
  onSelectRoute,
  onSelectCell,
}: AccessControlMatrixProps) {
  if (rows.length === 0) {
    return <p className={styles.empty}>Keine API-Routes erkannt.</p>;
  }

  return (
    <div className={styles.wrap} data-testid="security-matrix" data-access-control-v2="true">
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Route</th>
            <th>AuthN</th>
            <th>AuthZ</th>
            <th>Scope</th>
            <th>Tenant</th>
            <th>Ownership</th>
            <th>Validation</th>
            <th>Rate Limit</th>
            <th>Audit</th>
            <th>Findings</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const overall =
              typeof row.overallStatus === "string" ? row.overallStatus : "unverified";
            const badge = overallBadge(overall);
            const cells: { column: MatrixControlColumn; status: AccessControlStatus }[] = [
              { column: "authentication", status: cellStatus(row.authentication) },
              { column: "authorization", status: cellStatus(row.authorization) },
              { column: "resourceScope", status: cellStatus(row.resourceScope) },
              { column: "tenantIsolation", status: cellStatus(row.tenantIsolation) },
              { column: "ownership", status: cellStatus(row.ownership) },
              { column: "validation", status: cellStatus(row.validation) },
              { column: "rateLimit", status: cellStatus(row.rateLimit) },
              { column: "audit", status: cellStatus(row.audit) },
            ];
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
                {cells.map((cell) => (
                  <ControlCell
                    key={cell.column}
                    routeId={row.routeId}
                    column={cell.column}
                    status={cell.status}
                    selected={row.routeId === selectedRouteId && selectedControl === cell.column}
                    onSelect={onSelectCell}
                  />
                ))}
                <td>{typeof row.findingCount === "number" ? row.findingCount : 0}</td>
                <td>
                  <StatusBadge
                    variant={badge.variant}
                    label={badge.label}
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
