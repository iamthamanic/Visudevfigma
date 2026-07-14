/**
 * Blueprint Diagnostics view — Security Matrix, Route Canvas, findings, Problem-Inspektor.
 */

import { useMemo, useState } from "react";
import { RouteBlueprintCanvas } from "./RouteBlueprintCanvas";
import { SecurityMatrix } from "./SecurityMatrix";
import { useDiagnosticsSelection } from "./useDiagnosticsSelection";
import { useDiagnosticsFindingResolution } from "./useDiagnosticsFindingResolution";
import { BlueprintViewLayout } from "./ui/BlueprintViewLayout.js";
import { ViewSectionTitle } from "./ui/ViewSectionTitle.js";
import { DiagnosticsFindingsTable } from "./diagnostics/DiagnosticsFindingsTable.js";
import { DiagnosticsProblemInspector } from "./diagnostics/DiagnosticsProblemInspector.js";
import { DiagnosticsSubTabs, type DiagnosticsTabId } from "./diagnostics/DiagnosticsSubTabs.js";
import type { BlueprintData, BlueprintFinding } from "../types";
import styles from "../styles/DiagnosticsView.module.css";

interface DiagnosticsViewProps {
  blueprint: BlueprintData;
}

export function DiagnosticsView({ blueprint }: DiagnosticsViewProps) {
  const [activeTab, setActiveTab] = useState<DiagnosticsTabId>("security");
  const {
    routes,
    matrix,
    facts,
    selectedRouteId,
    selectedRoute,
    routeFindings,
    selectedFindingId,
    setSelectedFindingId,
    selectRoute,
  } = useDiagnosticsSelection(blueprint);

  const selectedFinding = useMemo(
    () => routeFindings.find((finding) => finding.id === selectedFindingId) ?? null,
    [routeFindings, selectedFindingId],
  );

  const { resolutionByFindingId, selectedResolutionStatus, toggleSelectedFindingResolved } =
    useDiagnosticsFindingResolution(blueprint, selectedFinding);

  const selectedMatrixRow = useMemo(
    () => matrix.find((row) => row.routeId === selectedRouteId) ?? null,
    [matrix, selectedRouteId],
  );

  const inspectorRoute = useMemo(() => {
    if (!selectedFinding) return selectedRoute;
    return routes.find((route) => route.id === selectedFinding.scopeId) ?? selectedRoute;
  }, [routes, selectedFinding, selectedRoute]);

  const inspectorMatrixRow = useMemo(() => {
    if (!selectedFinding) return selectedMatrixRow;
    return matrix.find((row) => row.routeId === selectedFinding.scopeId) ?? selectedMatrixRow;
  }, [matrix, selectedFinding, selectedMatrixRow]);

  return (
    <div className={styles.root}>
      <DiagnosticsSubTabs activeTab={activeTab} onSelectTab={setActiveTab} />

      {activeTab === "security" ? (
        <BlueprintViewLayout
          canvas={
            <div className={styles.securityCanvas}>
              <section aria-labelledby="matrix-title">
                <ViewSectionTitle>Sicherheits-Matrix</ViewSectionTitle>
                <SecurityMatrix
                  rows={matrix}
                  selectedRouteId={selectedRouteId}
                  onSelectRoute={selectRoute}
                />
              </section>
              <section aria-label="Findings" className={styles.findingsSection}>
                <DiagnosticsFindingsTable
                  findings={routeFindings}
                  facts={facts}
                  routes={routes}
                  selectedFindingId={selectedFindingId}
                  onSelectFinding={setSelectedFindingId}
                  resolutionByFindingId={resolutionByFindingId}
                />
              </section>
              <RouteBlueprintCanvas route={selectedRoute} />
            </div>
          }
          inspector={
            <DiagnosticsProblemInspector
              finding={selectedFinding}
              facts={facts}
              route={inspectorRoute}
              matrixRow={inspectorMatrixRow}
              resolutionStatus={selectedResolutionStatus}
              onToggleResolved={toggleSelectedFindingResolved}
            />
          }
        />
      ) : (
        <DiagnosticsPlaceholderTab tab={activeTab} findings={routeFindings} />
      )}
    </div>
  );
}

function DiagnosticsPlaceholderTab({
  tab,
  findings,
}: {
  tab: Exclude<DiagnosticsTabId, "security">;
  findings: BlueprintFinding[];
}): JSX.Element {
  const labels: Record<Exclude<DiagnosticsTabId, "security">, string> = {
    architecture: "Architektur-Diagnose",
    completeness: "Vollständigkeit",
    complexity: "Komplexität",
    evidence: "Evidence-Übersicht",
  };

  return (
    <div className={styles.placeholderPanel}>
      <h2 className={styles.placeholderTitle}>{labels[tab]}</h2>
      <p className={styles.emptyControls}>
        {tab === "evidence"
          ? `${findings.length} Finding(s) im Security-Tab verfügbar. Graph-basierte ${labels[tab]} folgt in einer späteren Phase.`
          : `Graph-basierte ${labels[tab]} folgt in einer späteren Phase. Security-Tab enthält die vollständige v1-Funktionalität.`}
      </p>
    </div>
  );
}
