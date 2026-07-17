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

function cellStatus(cell: AccessControlMatrixCell | undefined): AccessControlStatus {
  return cell?.status ?? "unverified";
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
            const overall =
              typeof row.overallStatus === "string" ? row.overallStatus : "unverified";
            const badge = overallBadge(overall);
            const authN = cellStatus(row.authentication);
            const authZ = cellStatus(row.authorization);
            const scope = cellStatus(row.resourceScope);
            const tenant = cellStatus(row.tenantIsolation);
            const ownership = cellStatus(row.ownership);
            const validation = cellStatus(row.validation);
            const rateLimit = cellStatus(row.rateLimit);
            const audit = cellStatus(row.audit);
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
                <td className={acStateClass(authN)}>{accessControlStatusSymbol(authN)}</td>
                <td className={acStateClass(authZ)}>{accessControlStatusSymbol(authZ)}</td>
                <td className={acStateClass(scope)}>{accessControlStatusSymbol(scope)}</td>
                <td className={acStateClass(tenant)}>{accessControlStatusSymbol(tenant)}</td>
                <td className={acStateClass(ownership)}>{accessControlStatusSymbol(ownership)}</td>
                <td className={acStateClass(validation)}>
                  {accessControlStatusSymbol(validation)}
                </td>
                <td className={acStateClass(rateLimit)}>{accessControlStatusSymbol(rateLimit)}</td>
                <td className={acStateClass(audit)}>{accessControlStatusSymbol(audit)}</td>
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
