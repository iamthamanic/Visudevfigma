/**
 * Access-control v2 Security Matrix — AuthN/AuthZ/Scope/Tenant/Ownership columns.
 * Shown when VITE_ACCESS_CONTROL_V2 is enabled and accessControlMatrix is present.
 * Location: src/modules/blueprint/components/AccessControlMatrix.tsx
 */

import type {
  AccessControlMatrixRow,
  AccessControlStatus,
} from "../../../lib/visudev/access-control-types";
import { accessControlStatusSymbol } from "../../../lib/visudev/access-control-types";
import { StatusBadge } from "./ui/StatusBadge.js";
import styles from "../styles/SecurityMatrix.module.css";

interface AccessControlMatrixProps {
  rows: AccessControlMatrixRow[];
  selectedRouteId: string | null;
  onSelectRoute: (routeId: string) => void;
}

function acStateClass(status: AccessControlStatus): string {
  if (status === "protected") return styles.stateConfirmed;
  if (status === "missing") return styles.stateMissing;
  if (status === "partial") return styles.statePartial;
  if (status === "unsupported" || status === "not-applicable") return styles.stateUnknown;
  return styles.stateUnknown;
}

function overallBadge(status: AccessControlStatus): {
  variant: "confirmed" | "warning" | "critical" | "missing";
  label: string;
} {
  if (status === "protected" || status === "not-applicable")
    return { variant: "confirmed", label: "OK" };
  if (status === "partial" || status === "unverified" || status === "unsupported")
    return { variant: "warning", label: "Warnung" };
  if (status === "missing") return { variant: "missing", label: "Hoch" };
  return { variant: "warning", label: "Warnung" };
}

export function AccessControlMatrix({
  rows,
  selectedRouteId,
  onSelectRoute,
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
            const badge = overallBadge(row.overallStatus);
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
                <td className={acStateClass(row.authentication.status)}>
                  {accessControlStatusSymbol(row.authentication.status)}
                </td>
                <td className={acStateClass(row.authorization.status)}>
                  {accessControlStatusSymbol(row.authorization.status)}
                </td>
                <td className={acStateClass(row.resourceScope.status)}>
                  {accessControlStatusSymbol(row.resourceScope.status)}
                </td>
                <td className={acStateClass(row.tenantIsolation.status)}>
                  {accessControlStatusSymbol(row.tenantIsolation.status)}
                </td>
                <td className={acStateClass(row.ownership.status)}>
                  {accessControlStatusSymbol(row.ownership.status)}
                </td>
                <td className={acStateClass(row.validation.status)}>
                  {accessControlStatusSymbol(row.validation.status)}
                </td>
                <td className={acStateClass(row.rateLimit.status)}>
                  {accessControlStatusSymbol(row.rateLimit.status)}
                </td>
                <td className={acStateClass(row.audit.status)}>
                  {accessControlStatusSymbol(row.audit.status)}
                </td>
                <td>{row.findingCount}</td>
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
