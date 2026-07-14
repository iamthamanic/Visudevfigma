/**
 * EvolutionView — compare SoftwareGraph snapshots with git timeline and diff highlighting.
 */

import { lazy, Suspense, useMemo, useState } from "react";
import type { BlueprintData } from "../types";
import { BlueprintViewLayout } from "./ui/BlueprintViewLayout.js";
import { EvolutionControls } from "./evolution/EvolutionControls.js";
import { EvolutionInspector } from "./evolution/EvolutionInspector.js";
import { EvolutionMetricsRow } from "./evolution/EvolutionMetricsRow.js";
import { EvolutionSnapshotCards } from "./evolution/EvolutionSnapshotCards.js";
import { EvolutionSubTabs } from "./evolution/EvolutionSubTabs.js";
import { type EvolutionTabId } from "./evolution/evolution-tabs.js";
import { findSnapshot } from "./evolution/_diff.js";
import { useEvolutionViewState } from "./evolution/useEvolutionViewState.js";
import styles from "../styles/EvolutionView.module.css";

const GraphCanvas = lazy(() =>
  import("../../../components/GraphCanvas").then((module) => ({ default: module.GraphCanvas })),
);

interface EvolutionViewProps {
  blueprint: BlueprintData;
  projectId?: string;
}

export function EvolutionView({ blueprint, projectId }: EvolutionViewProps) {
  const [activeTab, setActiveTab] = useState<EvolutionTabId>("timeline");
  const {
    graph,
    snapshots,
    gitSummary,
    gitLoadError,
    baseSnapshotId,
    targetSnapshotId,
    setBaseSnapshotId,
    setTargetSnapshotId,
    diff,
    projection,
    hasDiffNodes,
  } = useEvolutionViewState(blueprint, projectId);

  const targetSnapshot = useMemo(() => {
    if (!graph || !targetSnapshotId) return null;
    return findSnapshot(graph, targetSnapshotId) ?? null;
  }, [graph, targetSnapshotId]);

  if (!graph) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>Keine Evolution-Daten</p>
        <p className={styles.emptyHint}>
          Starte eine Blueprint-Analyse, um Snapshots und Architektur-Diffs zu sehen.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <EvolutionSubTabs activeTab={activeTab} onSelectTab={setActiveTab} />

      <EvolutionSnapshotCards
        snapshots={snapshots}
        baseSnapshotId={baseSnapshotId}
        targetSnapshotId={targetSnapshotId}
        onSelectBase={setBaseSnapshotId}
        onSelectTarget={setTargetSnapshotId}
      />
      <EvolutionMetricsRow diff={diff} />

      <BlueprintViewLayout
        controls={
          <EvolutionControls
            snapshots={snapshots}
            gitSummary={gitSummary}
            gitLoadError={gitLoadError}
            baseSnapshotId={baseSnapshotId}
            targetSnapshotId={targetSnapshotId}
            identical={diff?.identical ?? false}
            condensed={diff?.condensed ?? false}
            onSelectBase={setBaseSnapshotId}
            onSelectTarget={setTargetSnapshotId}
          />
        }
        canvas={
          <div className={styles.canvasWrap}>
            {hasDiffNodes ? (
              <Suspense fallback={<p className={styles.loading}>Graph wird geladen...</p>}>
                <GraphCanvas
                  nodes={projection?.nodes ?? []}
                  edges={projection?.edges ?? []}
                  layoutPreset="force"
                />
              </Suspense>
            ) : (
              <div className={styles.filteredCanvasEmpty}>
                <p>
                  {diff?.identical
                    ? "Identische Snapshots — keine hervorgehobenen Knoten."
                    : "Wähle zwei verschiedene Snapshots mit Unterschieden."}
                </p>
              </div>
            )}
          </div>
        }
        inspector={
          <EvolutionInspector targetSnapshot={targetSnapshot} diff={diff} gitSummary={gitSummary} />
        }
      />
    </div>
  );
}
