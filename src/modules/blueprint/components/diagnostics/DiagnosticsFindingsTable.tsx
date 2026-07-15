/**
 * Paginated findings table for Diagnostics Security tab; drives Problem-Inspektor selection.
 */

import { useEffect, useMemo, useState } from "react";
import type { BlueprintFinding, CodeFact, RouteBlueprint } from "../../types";
import { StatusBadge } from "../ui/StatusBadge.js";
import { ViewSectionTitle } from "../ui/ViewSectionTitle.js";
import { SEVERITY_LABELS, severityBadgeVariant } from "./diagnostics-severity.js";
import { findingLocationLabel } from "./diagnostics-finding-location.js";
import type { FindingResolutionStatus } from "./finding-resolution.js";
import styles from "../../styles/DiagnosticsView.module.css";

const PAGE_SIZE = 5;

interface DiagnosticsFindingsTableProps {
  findings: BlueprintFinding[];
  facts: CodeFact[];
  routes: RouteBlueprint[];
  selectedFindingId: string | null;
  onSelectFinding: (id: string | null) => void;
  resolutionByFindingId?: Record<string, FindingResolutionStatus>;
}

export function DiagnosticsFindingsTable({
  findings,
  facts,
  routes,
  selectedFindingId,
  onSelectFinding,
  resolutionByFindingId = {},
}: DiagnosticsFindingsTableProps): JSX.Element {
  const [page, setPage] = useState(0);
  const routeMap = useMemo(() => new Map(routes.map((route) => [route.id, route])), [routes]);
  const pageCount = Math.max(1, Math.ceil(findings.length / PAGE_SIZE));

  useEffect(() => {
    if (page > pageCount - 1) {
      setPage(Math.max(0, pageCount - 1));
    }
  }, [page, pageCount]);

  useEffect(() => {
    setPage(0);
  }, [findings]);

  const pageFindings = useMemo(() => {
    const start = page * PAGE_SIZE;
    return findings.slice(start, start + PAGE_SIZE);
  }, [findings, page]);

  return (
    <section className={styles.findingsSectionInner} aria-label="Findings">
      <ViewSectionTitle>Findings</ViewSectionTitle>
      {findings.length === 0 ? (
        <p className={styles.emptyControls}>Keine Findings für diese Auswahl.</p>
      ) : (
        <>
          <div className={styles.findingsTableWrap}>
            <table className={styles.findingsTable} data-testid="findings-table">
              <thead>
                <tr>
                  <th>Schwere</th>
                  <th>Regel</th>
                  <th>Ort</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {pageFindings.map((finding) => {
                  const isActive = finding.id === selectedFindingId;
                  const route = routeMap.get(finding.scopeId) ?? null;
                  const location = findingLocationLabel(finding, facts, route);
                  return (
                    <tr
                      key={finding.id}
                      className={isActive ? styles.findingsRowActive : undefined}
                    >
                      <td>
                        <button
                          type="button"
                          className={styles.findingsRowButton}
                          aria-pressed={isActive}
                          onClick={() =>
                            onSelectFinding(finding.id === selectedFindingId ? null : finding.id)
                          }
                        >
                          <StatusBadge
                            variant={severityBadgeVariant(finding.severity)}
                            label={SEVERITY_LABELS[finding.severity]}
                          />
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.findingsRowButton}
                          aria-pressed={isActive}
                          onClick={() =>
                            onSelectFinding(finding.id === selectedFindingId ? null : finding.id)
                          }
                        >
                          <code className={styles.findingsRule}>{finding.ruleId}</code>
                          <span className={styles.findingMessage}>{finding.message}</span>
                        </button>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={styles.findingsRowButton}
                          aria-pressed={isActive}
                          onClick={() =>
                            onSelectFinding(finding.id === selectedFindingId ? null : finding.id)
                          }
                        >
                          <span className={styles.findingsLocation}>{location}</span>
                        </button>
                      </td>
                      <td>
                        <span
                          className={styles.findingsStatus}
                          data-testid={`finding-status-${finding.id}`}
                        >
                          {resolutionByFindingId[finding.id] === "resolved" ? "Erledigt" : "Offen"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div
            className={styles.findingsPagination}
            aria-label="Findings-Seiten"
            data-testid="findings-pagination"
          >
            <span className={styles.findingsPageLabel}>
              Seite {page + 1} von {pageCount}
            </span>
            <div className={styles.findingsPageActions}>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                disabled={page === 0}
                onClick={() => setPage((current) => Math.max(0, current - 1))}
              >
                Zurück
              </button>
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                disabled={page >= pageCount - 1}
                onClick={() => setPage((current) => Math.min(pageCount - 1, current + 1))}
              >
                Weiter
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}
