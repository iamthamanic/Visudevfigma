/**
 * AtlasView — birds-eye 2D clustered map of the whole SoftwareGraph.
 */

import { lazy, Suspense, useMemo, useState } from "react";
import type { BlueprintData } from "../types";
import { AtlasControls } from "./atlas/AtlasControls.js";
import { projectAtlasGraph } from "./atlas/_projection.js";
import styles from "../styles/AtlasView.module.css";

const GraphCanvas = lazy(() =>
  import("../../../components/GraphCanvas").then((module) => ({ default: module.GraphCanvas })),
);

interface AtlasViewProps {
  blueprint: BlueprintData;
}

export function AtlasView({ blueprint }: AtlasViewProps) {
  const graph = blueprint.graph;
  const [searchQuery, setSearchQuery] = useState("");

  const projection = useMemo(() => {
    if (!graph) {
      return { nodes: [], edges: [], condensed: false, totalNodes: 0, visibleNodes: 0 };
    }
    return projectAtlasGraph(graph, { searchQuery });
  }, [graph, searchQuery]);

  if (!graph) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>Keine Atlas-Daten</p>
        <p className={styles.emptyHint}>
          Starte eine Blueprint-Analyse, um die Systemübersicht als 2D-Karte zu sehen.
        </p>
      </div>
    );
  }

  const hasVisibleNodes = projection.nodes.length > 0;

  return (
    <div className={styles.root}>
      <AtlasControls
        searchQuery={searchQuery}
        totalNodes={projection.totalNodes}
        visibleNodes={projection.visibleNodes}
        condensed={projection.condensed}
        onSearchChange={setSearchQuery}
        onResetSearch={() => setSearchQuery("")}
      />

      <div className={styles.canvasWrap}>
        {hasVisibleNodes ? (
          <Suspense fallback={<p className={styles.loading}>Atlas wird geladen...</p>}>
            <GraphCanvas nodes={projection.nodes} edges={projection.edges} layoutPreset="force" />
          </Suspense>
        ) : (
          <div className={styles.filteredCanvasEmpty}>
            <p>Keine Knoten für die aktuelle Suche. Passe den Suchbegriff an.</p>
          </div>
        )}
      </div>
    </div>
  );
}
