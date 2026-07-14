/**
 * DependenciesView — cross-module imports, calls, API, events, and data edges.
 */

import { useMemo, useState } from "react";
import type { BlueprintData } from "../types";
import { BlueprintViewLayout } from "./ui/BlueprintViewLayout.js";
import { DependenciesControls } from "./dependencies/DependenciesControls.js";
import { DependenciesGraphCanvas } from "./dependencies/DependenciesGraphCanvas.js";
import { DependenciesInspector } from "./dependencies/DependenciesInspector.js";
import {
  DEFAULT_VISIBLE_DEPENDENCY_KINDS,
  countDependencyEdgesByKind,
  filterDependenciesProjection,
  findEdgeEvidence,
  projectDependenciesGraph,
  type DependencyEdgeKind,
} from "./dependencies/_projection.js";
import { useDependenciesSearch } from "./dependencies/useDependenciesSearch.js";
import styles from "../styles/DependenciesView.module.css";

interface DependenciesViewProps {
  blueprint: BlueprintData;
}

export function DependenciesView({ blueprint }: DependenciesViewProps) {
  const graph = blueprint.graph;
  const { searchQuery, searchInputRef, setSearchQuery, resetSearch } = useDependenciesSearch();
  const [visibleEdgeKinds, setVisibleEdgeKinds] = useState<Set<DependencyEdgeKind>>(
    () => new Set(DEFAULT_VISIBLE_DEPENDENCY_KINDS),
  );
  const [selectedEdgeId, setSelectedEdgeId] = useState<string | null>(null);

  const baseProjection = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };
    return projectDependenciesGraph(graph, { visibleEdgeKinds });
  }, [graph, visibleEdgeKinds]);

  const projection = useMemo(
    () =>
      graph ? filterDependenciesProjection(baseProjection, searchQuery, graph) : baseProjection,
    [baseProjection, searchQuery, graph],
  );

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
    resetSearch();
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

  const hasVisibleGraph = projection.nodes.length > 0;

  const handleMinimapSelect = (nodeId: string) => {
    const graphNode = graph.nodes.find((candidate) => candidate.id === nodeId);
    if (!graphNode) return;
    setSearchQuery(graphNode.label);
    searchInputRef.current?.focus();
  };

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
          {hasVisibleGraph ? (
            <DependenciesGraphCanvas
              nodes={projection.nodes}
              edges={projection.edges}
              totalNodes={baseProjection.nodes.length}
              totalEdges={baseProjection.edges.length}
              searchQuery={searchQuery}
              searchInputRef={searchInputRef}
              onSearchChange={setSearchQuery}
              onResetSearch={resetSearch}
              onEdgeSelect={setSelectedEdgeId}
              onMinimapSelect={handleMinimapSelect}
            />
          ) : (
            <div className={styles.filteredCanvasEmpty}>
              <p>
                {searchQuery
                  ? "Keine Module für die aktuelle Suche. Passe den Suchbegriff an."
                  : "Passe die Beziehungstypen an, um Abhängigkeiten anzuzeigen."}
              </p>
            </div>
          )}
        </div>
      }
      inspector={
        <DependenciesInspector
          graph={graph}
          topDependencies={topDependencies}
          selectedEdge={selection?.edge ?? null}
          selectedEvidence={selection?.evidence ?? []}
        />
      }
    />
  );
}
