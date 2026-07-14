/**
 * ExecutionView — horizontal route execution pipelines from SoftwareGraph paths.
 */

import { useEffect, useMemo, useState } from "react";
import type { BlueprintData, SoftwareGraphNodeKind } from "../types";
import { BlueprintViewLayout } from "./ui/BlueprintViewLayout.js";
import { ViewSectionTitle } from "./ui/ViewSectionTitle.js";
import { ExecutionDetailTabs } from "./execution/ExecutionDetailTabs.js";
import { ExecutionInspector } from "./execution/ExecutionInspector.js";
import { ExecutionLiveBadge } from "./execution/ExecutionLiveBadge.js";
import { ExecutionMetricsBar } from "./execution/ExecutionMetricsBar.js";
import { ExecutionSchritteList } from "./execution/ExecutionSchritteList.js";
import { ExecutionStepPipeline } from "./execution/ExecutionStepPipeline.js";
import { ExecutionTimelineRuler } from "./execution/ExecutionTimelineRuler.js";
import {
  computeExecutionMetrics,
  computeStepTimings,
  findStepEvidence,
  isExecutionLive,
  listExecutionRoutes,
  projectExecutionGraph,
} from "./execution/_projection.js";
import styles from "../styles/ExecutionView.module.css";

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

  const stepHasEvidence = useMemo(() => {
    const map = new Map<string, boolean>();
    if (!graph || !projection) return map;
    for (const nodeId of projection.stepNodeIds) {
      map.set(nodeId, findStepEvidence(graph, nodeId).length > 0);
    }
    return map;
  }, [graph, projection]);

  const selectedEvidence = useMemo(
    () => (graph ? findStepEvidence(graph, selectedStepId) : []),
    [graph, selectedStepId],
  );

  const activeRouteId = selectedRouteId ?? routes[0]?.routeId ?? null;

  const stepTimings = useMemo(() => {
    if (!graph || !projection) return [];
    return computeStepTimings(graph, projection.stepNodeIds);
  }, [graph, projection]);

  const executionMetrics = useMemo(
    () =>
      graph
        ? computeExecutionMetrics(projection, graph)
        : { totalDurationMs: 0, stepCount: 0, errorCount: 0 },
    [graph, projection],
  );

  const isLive = useMemo(() => {
    if (!graph || !activeRouteId) return false;
    return isExecutionLive(graph, activeRouteId);
  }, [graph, activeRouteId]);

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

  const selectedStepLabel = selectedStepId ? (stepLabels.get(selectedStepId) ?? null) : null;
  const selectedStepKind = selectedStepId ? (stepKinds.get(selectedStepId) ?? null) : null;

  return (
    <div className={styles.root}>
      <header className={styles.header}>
        <ExecutionLiveBadge live={isLive} />
        <ViewSectionTitle>Route</ViewSectionTitle>
        {routes.length === 0 ? (
          <p className={styles.emptyControls}>Keine Routen im Graph vorhanden.</p>
        ) : (
          <select
            className={styles.select}
            value={activeRouteId ?? ""}
            onChange={(event) => handleSelectRoute(event.target.value)}
            aria-label="Route auswählen"
          >
            {routes.map((route) => (
              <option key={route.routeId} value={route.routeId}>
                {route.label}
              </option>
            ))}
          </select>
        )}
      </header>

      <ExecutionTimelineRuler stepTimings={stepTimings} />
      <ExecutionMetricsBar metrics={executionMetrics} />

      <ExecutionStepPipeline
        stepNodeIds={projection?.stepNodeIds ?? []}
        stepLabels={stepLabels}
        stepKinds={stepKinds}
        stepTimings={stepTimings}
        selectedStepId={selectedStepId}
        stepHasEvidence={stepHasEvidence}
        cycleNodeId={projection?.cycleNodeId ?? null}
        onSelectStep={setSelectedStepId}
      />

      <BlueprintViewLayout
        controls={
          <ExecutionSchritteList
            stepNodeIds={projection?.stepNodeIds ?? []}
            stepLabels={stepLabels}
            stepKinds={stepKinds}
            selectedStepId={selectedStepId}
            cycleNodeId={projection?.cycleNodeId ?? null}
            onSelectStep={setSelectedStepId}
          />
        }
        canvas={
          <ExecutionDetailTabs
            stepLabel={selectedStepLabel}
            stepKind={selectedStepKind}
            selectedEvidence={selectedEvidence}
          />
        }
        inspector={
          <ExecutionInspector
            stepLabel={selectedStepLabel}
            stepKind={selectedStepKind}
            selectedEvidence={selectedEvidence}
          />
        }
      />
    </div>
  );
}
