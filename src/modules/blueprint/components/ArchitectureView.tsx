import { lazy, Suspense, useMemo, useState } from "react";
import type { BlueprintData, SoftwareGraphNodeKind } from "../types";
import { applyArchitectureNodeColors } from "./architecture/_apply-colors.js";
import { ArchitectureControls } from "./architecture/ArchitectureControls.js";
import { DEFAULT_VISIBLE_KINDS, projectArchitectureGraph } from "./architecture/_projection.js";
import styles from "../styles/ArchitectureView.module.css";

const GraphCanvas = lazy(() =>
  import("../../../components/GraphCanvas").then((module) => ({ default: module.GraphCanvas })),
);

interface ArchitectureViewProps {
  blueprint: BlueprintData;
}

export function ArchitectureView({ blueprint }: ArchitectureViewProps) {
  const graph = blueprint.graph;
  const [collapsedIds, setCollapsedIds] = useState<Set<string>>(() => new Set());
  const [visibleKinds, setVisibleKinds] = useState<Set<SoftwareGraphNodeKind>>(
    () => new Set(DEFAULT_VISIBLE_KINDS),
  );

  const architectureProjection = useMemo(() => {
    if (!graph) {
      return { nodes: [], edges: [], collapsible: [] };
    }
    const projectedArchitecture = projectArchitectureGraph(graph, { collapsedIds, visibleKinds });
    return {
      ...projectedArchitecture,
      nodes: applyArchitectureNodeColors(projectedArchitecture.nodes),
    };
  }, [graph, collapsedIds, visibleKinds]);

  const toggleCollapse = (id: string) => {
    setCollapsedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleKind = (kind: SoftwareGraphNodeKind) => {
    setVisibleKinds((current) => {
      const next = new Set(current);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  };

  const resetFilters = () => {
    setCollapsedIds(new Set());
    setVisibleKinds(new Set(DEFAULT_VISIBLE_KINDS));
  };

  if (!graph) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>Keine Architektur-Daten</p>
        <p className={styles.emptyHint}>
          Starte eine neue Blueprint-Analyse, um Domains, Layer und Module zu sehen.
        </p>
      </div>
    );
  }

  const hasVisibleNodes = architectureProjection.nodes.length > 0;

  return (
    <div className={styles.root}>
      <ArchitectureControls
        collapsible={architectureProjection.collapsible}
        collapsedIds={collapsedIds}
        visibleKinds={visibleKinds}
        hasVisibleNodes={hasVisibleNodes}
        onToggleCollapse={toggleCollapse}
        onToggleKind={toggleKind}
        onResetFilters={resetFilters}
      />

      <div className={styles.canvasWrap}>
        {hasVisibleNodes ? (
          <Suspense fallback={<p className={styles.loading}>Graph wird geladen...</p>}>
            <GraphCanvas
              nodes={architectureProjection.nodes}
              edges={architectureProjection.edges}
              layoutPreset="hierarchical"
            />
          </Suspense>
        ) : (
          <div className={styles.filteredCanvasEmpty}>
            <p>Passe Filter oder Einklapp-Zustand an, um Knoten anzuzeigen.</p>
          </div>
        )}
      </div>
    </div>
  );
}
