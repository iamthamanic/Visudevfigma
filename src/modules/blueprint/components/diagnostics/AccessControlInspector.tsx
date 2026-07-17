/**
 * Access Control Inspector — mechanisms, enforcement layers, evidence, bypass warnings.
 * Why: matrix cells stay stack-agnostic; technology detail (e.g. PostgreSQL RLS) lives here.
 * Location: src/modules/blueprint/components/diagnostics/AccessControlInspector.tsx
 */

import type {
  AccessControlControl,
  AccessControlFinding,
  AccessControlStatus,
} from "../../../../lib/visudev/access-control-types";
import { accessControlStatusSymbol } from "../../../../lib/visudev/access-control-types";
import { InspectorPanel } from "../ui/InspectorPanel.js";
import { StatusBadge } from "../ui/StatusBadge.js";
import styles from "../../styles/AccessControlInspector.module.css";

const CONTROL_LABELS: Record<AccessControlControl, string> = {
  authentication: "Authentifizierung",
  authorization: "Autorisierung",
  "resource-scope": "Resource Scope",
  "tenant-isolation": "Tenant-Isolation",
  ownership: "Ownership",
  "read-restriction": "Lese-Beschränkung",
  "write-restriction": "Schreib-Beschränkung",
  validation: "Validation",
  "rate-limit": "Rate Limit",
  "privileged-access": "Privileged Access",
  audit: "Audit",
  encryption: "Encryption",
};

function statusBadge(status: AccessControlStatus): {
  variant: "confirmed" | "warning" | "missing" | "unknown" | "critical";
  label: string;
} {
  // unsupported must never render as critical red — honest "not available" signal
  if (status === "protected" || status === "not-applicable") {
    return { variant: "confirmed", label: `${accessControlStatusSymbol(status)} OK` };
  }
  if (status === "unsupported") {
    return { variant: "unknown", label: `${accessControlStatusSymbol(status)} Nicht unterstützt` };
  }
  if (status === "missing") {
    return { variant: "missing", label: `${accessControlStatusSymbol(status)} Fehlt` };
  }
  if (status === "partial") {
    return { variant: "warning", label: `${accessControlStatusSymbol(status)} Teilweise` };
  }
  return { variant: "unknown", label: `${accessControlStatusSymbol(status)} Ungeprüft` };
}

export type MatrixControlColumn =
  | "authentication"
  | "authorization"
  | "resourceScope"
  | "tenantIsolation"
  | "ownership"
  | "validation"
  | "rateLimit"
  | "audit";

export const MATRIX_COLUMN_TO_CONTROL: Record<MatrixControlColumn, AccessControlControl> = {
  authentication: "authentication",
  authorization: "authorization",
  resourceScope: "resource-scope",
  tenantIsolation: "tenant-isolation",
  ownership: "ownership",
  validation: "validation",
  rateLimit: "rate-limit",
  audit: "audit",
};

interface AccessControlInspectorProps {
  findings: AccessControlFinding[];
  routeId: string | null;
  selectedControl: AccessControlControl | null;
  routeLabel?: string | null;
}

export function AccessControlInspector({
  findings,
  routeId,
  selectedControl,
  routeLabel,
}: AccessControlInspectorProps): JSX.Element {
  const scoped = findings.filter((finding) => {
    if (routeId && finding.resourceId !== routeId) return false;
    if (selectedControl && finding.control !== selectedControl) return false;
    return true;
  });

  if (!routeId && !selectedControl) {
    return (
      <InspectorPanel
        title="Keine Auswahl"
        emptyMessage="Klicke eine Matrix-Zelle, um Mechanismen und Evidence zu sehen."
        testId="access-control-inspector"
      />
    );
  }

  if (scoped.length === 0) {
    return (
      <InspectorPanel
        title={selectedControl ? CONTROL_LABELS[selectedControl] : "Access Control"}
        subtitle={routeLabel ?? routeId ?? undefined}
        emptyMessage="Keine Access-Control-Findings für diese Auswahl."
        testId="access-control-inspector"
      />
    );
  }

  const primary = scoped[0];
  const badge = statusBadge(primary.status);

  return (
    <InspectorPanel
      title={CONTROL_LABELS[primary.control] ?? primary.control}
      subtitle={routeLabel ?? primary.resourceId}
      badges={<StatusBadge variant={badge.variant} label={badge.label} />}
      testId="access-control-inspector"
      sections={scoped.flatMap((finding, index) => {
        const findingBadge = statusBadge(finding.status);
        return [
          {
            id: `status-${finding.id}`,
            title: scoped.length > 1 ? `Finding ${index + 1}` : "Status",
            content: (
              <div className={styles.block}>
                <StatusBadge variant={findingBadge.variant} label={findingBadge.label} />
                <p className={styles.meta}>
                  Confidence {Math.round(finding.confidence)}% · {finding.resourceKind}
                  {finding.ruleId ? ` · ${finding.ruleId}` : ""}
                </p>
                {finding.warning ? (
                  <p className={styles.warning} data-testid="ac-bypass-warning">
                    Bypass-Hinweis: {finding.warning}
                  </p>
                ) : null}
              </div>
            ),
          },
          {
            id: `mechanisms-${finding.id}`,
            title: "Mechanismen",
            content:
              finding.mechanisms.length === 0 ? (
                <p className={styles.empty}>Keine Mechanismen erkannt.</p>
              ) : (
                <ul className={styles.list} data-testid="ac-mechanisms">
                  {finding.mechanisms.map((mechanism) => (
                    <li key={`${finding.id}-${mechanism.kind}-${mechanism.label}`}>
                      <span className={styles.mechanismLabel}>{mechanism.label}</span>
                      <span className={styles.mechanismKind}>{mechanism.kind}</span>
                      {mechanism.technology ? (
                        <span className={styles.mechanismTech}>{mechanism.technology}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ),
          },
          {
            id: `layers-${finding.id}`,
            title: "Enforcement Layers",
            content:
              finding.enforcementLayers.length === 0 ? (
                <p className={styles.empty}>Keine Layer ausgewiesen.</p>
              ) : (
                <ul className={styles.chips} data-testid="ac-enforcement-layers">
                  {finding.enforcementLayers.map((layer) => (
                    <li key={`${finding.id}-${layer}`}>{layer}</li>
                  ))}
                </ul>
              ),
          },
          {
            id: `evidence-${finding.id}`,
            title: "Evidence",
            content:
              finding.evidence.length === 0 ? (
                <p className={styles.empty}>Keine Evidence.</p>
              ) : (
                <ul className={styles.evidenceList} data-testid="ac-evidence">
                  {finding.evidence.map((item) => (
                    <li key={item.id}>
                      <code className={styles.evidencePath}>
                        {item.filePath}:{item.line}
                      </code>
                      <pre className={styles.evidenceExcerpt}>{item.excerpt}</pre>
                    </li>
                  ))}
                </ul>
              ),
          },
        ];
      })}
    />
  );
}
