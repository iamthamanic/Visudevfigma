/**
 * DependenciesView — cross-module imports, calls, API, events, and data edges.
 */

import { lazy, Suspense, useMemo, useState } from "react";
import type { BlueprintData } from "../types";
import { BlueprintViewLayout } from "./ui/BlueprintViewLayout.js";
import { DependenciesControls } from "./dependencies/DependenciesControls.js";
import { DependenciesInspector } from "./dependencies/DependenciesInspector.js";
import {
  DEFAULT_VISIBLE_DEPENDENCY_KINDS,
  countDependencyEdgesByKind,
  findEdgeEvidence,
  projectDependenciesGraph,
  type DependencyEdgeKind,
} from "./dependencies/_projection.js";
import styles from "../styles/DependenciesView.module.css";

const GraphCanvas = lazy(() =>
  import("../../../components/GraphCanvas").then((module) => ({ default: module.GraphCanvas })),
);

interface DependenciesViewProps {
  blueprint: BlueprintData;
}

export function DependenciesView({ blueprint }: DependenciesViewProps) {
  const graph = blueprint.graph;
  const [visibleEdgeKinds, setVisibleEdgeKinds] = useState<Set<DependencyEdgeKind>>(
    () => new Set(DEFAULT_VISIBLE_DEPENDENCY_KINDS),
  );
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const projection = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };
    return projectDependenciesGraph(graph, { visibleEdgeKinds });
  }, [graph, visibleEdgeKinds]);

  const topDependencies = useMemo(() => {
    if (!graph) return [];
    return countDependencyEdgesByKind(graph);
  }, [graph]);

  const selection = useMemo(() => {
    if (!graph) return null;
    return findEdgeEvidence(graph, selectedEdgeId);
  }, [graph, selectedEdgeId]);

  const toggleEdgeKind = (kind: DependencyEdgeKind) => {
    setVisibleEdgeKinds((current) => {
      const next = new Set(current);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
    setSelectedEdgeId(null);
  };

  const resetFilters = () => {
    setVisibleEdgeKinds(new Set(DEFAULT_VISIBLE_DEPENDENCY_KINDS));
    setSelectedEdgeId(null);
  };

  if (!graph) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>Keine Abhängigkeits-Daten</p>
        <p className={styles.emptyHint}>
          Starte eine neue Blueprint-Analyse, um Import-, Call-, API-, Event- und Data-Kanten zu
          sehen.
        </p>
      </div>
    );
  }

  const hasVisibleEdges = projection.edges.length > 0;

  return (
    <BlueprintViewLayout
      controls={
        <DependenciesControls
          visibleEdgeKinds={visibleEdgeKinds}
          topDependencies={topDependencies}
          onToggleEdgeKind={toggleEdgeKind}
          onResetFilters={resetFilters}
        />
      }
      canvas={
        <div className={styles.canvasWrap}>
          {hasVisibleEdges ? (
            <Suspense fallback={<p className={styles.loading}>Graph wird geladen...</p>}>
              <GraphCanvas
                nodes={projection.nodes}
                edges={projection.edges}
                layoutPreset="force"
                onEdgeSelect={setSelectedEdgeId}
              />
            </Suspense>
          ) : (
            <div className={styles.filteredCanvasEmpty}>
              <p>Passe die Beziehungstypen an, um Abhängigkeiten anzuzeigen.</p>
            </div>
          )}
        </div>
      }
      inspector={
        <DependenciesInspector
          graph={graph}
          selectedEdge={selection?.edge ?? null}
          selectedEvidence={selection?.evidence ?? []}
        />
      }
    />
  );
}
