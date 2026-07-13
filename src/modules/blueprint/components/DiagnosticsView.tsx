/**
 * Blueprint Diagnostics view — wraps the v1 Security Matrix, Route Canvas, and Finding Inspector.
 */

import { FindingInspector } from "./FindingInspector";
import { RouteBlueprintCanvas } from "./RouteBlueprintCanvas";
import { SecurityMatrix } from "./SecurityMatrix";
import { useDiagnosticsSelection } from "./useDiagnosticsSelection";
import type { BlueprintData } from "../types";
import styles from "../styles/DiagnosticsView.module.css";

interface DiagnosticsViewProps {
  blueprint: BlueprintData;
}

export function DiagnosticsView({ blueprint }: DiagnosticsViewProps) {
  const {
    matrix,
    facts,
    selectedRouteId,
    selectedRoute,
    routeFindings,
    selectedFindingId,
    setSelectedFindingId,
    selectRoute,
  } = useDiagnosticsSelection(blueprint);

  return (
    <div className={styles.root}>
      <section className={styles.mainPanel} aria-labelledby="matrix-title">
        <h2 id="matrix-title" className={styles.panelTitle}>
          Security Matrix
        </h2>
        <SecurityMatrix
          rows={matrix}
          selectedRouteId={selectedRouteId}
          onSelectRoute={selectRoute}
        />
        <RouteBlueprintCanvas route={selectedRoute} />
      </section>
      <FindingInspector
        findings={routeFindings}
        facts={facts}
        selectedFindingId={selectedFindingId}
        onSelectFinding={setSelectedFindingId}
      />
    </div>
  );
}
