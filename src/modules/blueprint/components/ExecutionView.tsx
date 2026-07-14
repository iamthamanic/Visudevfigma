/**
 * ExecutionView — horizontal route execution pipelines from SoftwareGraph paths.
 */

import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { BlueprintData, SoftwareGraphNodeKind } from "../types";
import { ExecutionControls } from "./execution/ExecutionControls.js";
import {
  findStepEvidence,
  listExecutionRoutes,
  projectExecutionGraph,
} from "./execution/_projection.js";
import styles from "../styles/ExecutionView.module.css";

const GraphCanvas = lazy(() =>
  import("../../../components/GraphCanvas").then((module) => ({ default: module.GraphCanvas })),
);

interface ExecutionViewProps {
  blueprint: BlueprintData;
}

export function ExecutionView({ blueprint }: ExecutionViewProps) {
  const graph = blueprint.graph;
  const routes = useMemo(() => (graph ? listExecutionRoutes(graph) : []), [graph]);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  useEffect(() => {
    if (routes.length === 0) {
      setSelectedRouteId(null);
      setSelectedStepId(null);
      return;
    }
    if (!selectedRouteId || !routes.some((route) => route.routeId === selectedRouteId)) {
      setSelectedRouteId(routes[0].routeId);
      setSelectedStepId(null);
    }
  }, [routes, selectedRouteId]);

  const projection = useMemo(() => {
    if (!graph || !selectedRouteId) return null;
    return projectExecutionGraph(graph, { routeId: selectedRouteId });
  }, [graph, selectedRouteId]);

  const stepLabels = useMemo(() => {
    const labels = new Map<string, string>();
    if (!graph || !projection) return labels;
    for (const nodeId of projection.stepNodeIds) {
      const node = graph.nodes.find((candidate) => candidate.id === nodeId);
      if (node) labels.set(nodeId, node.label);
    }
    return labels;
  }, [graph, projection]);

  const stepKinds = useMemo(() => {
    const kinds = new Map<string, SoftwareGraphNodeKind>();
    if (!graph || !projection) return kinds;
    for (const nodeId of projection.stepNodeIds) {
      const node = graph.nodes.find((candidate) => candidate.id === nodeId);
      if (node) kinds.set(nodeId, node.kind);
    }
    return kinds;
  }, [graph, projection]);

  const selectedEvidence = useMemo(
    () => (graph ? findStepEvidence(graph, selectedStepId) : []),
    [graph, selectedStepId],
  );

  const handleSelectRoute = (routeId: string) => {
    setSelectedRouteId(routeId);
    setSelectedStepId(null);
  };

  if (!graph) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>Keine Execution-Daten</p>
        <p className={styles.emptyHint}>
          Starte eine Blueprint-Analyse, um Routen-Pipelines und Ausführungsschritte zu sehen.
        </p>
      </div>
    );
  }

  const activeRouteId = selectedRouteId ?? routes[0]?.routeId ?? null;

  return (
    <div className={styles.root}>
      <ExecutionControls
        routes={routes}
        selectedRouteId={activeRouteId}
        stepNodeIds={projection?.stepNodeIds ?? []}
        stepLabels={stepLabels}
        stepKinds={stepKinds}
        selectedStepId={selectedStepId}
        selectedEvidence={selectedEvidence}
        cycleNodeId={projection?.cycleNodeId ?? null}
        onSelectRoute={handleSelectRoute}
        onSelectStep={setSelectedStepId}
      />

      <div className={styles.canvasWrap}>
        {projection && projection.nodes.length > 0 ? (
          <Suspense fallback={<p className={styles.loading}>Graph wird geladen...</p>}>
            <GraphCanvas
              nodes={projection.nodes}
              edges={projection.edges}
              layoutPreset="pipeline"
            />
          </Suspense>
        ) : (
          <div className={styles.empty}>
            <p className={styles.emptyHint}>Wähle eine Route mit Ausführungsschritten.</p>
          </div>
        )}
      </div>
    </div>
  );
}
