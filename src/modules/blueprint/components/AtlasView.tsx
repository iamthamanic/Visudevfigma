/**
 * AtlasView — birds-eye 2D clustered map of the whole SoftwareGraph.
 */

import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import type { BlueprintData } from "../types";
import { BlueprintViewLayout } from "./ui/BlueprintViewLayout.js";
import { AtlasControls } from "./atlas/AtlasControls.js";
import { AtlasInspector } from "./atlas/AtlasInspector.js";
import { findGraphNode, listVisibleGroups } from "./atlas/atlas-display.js";
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
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const projection = useMemo(() => {
    if (!graph) {
      return { nodes: [], edges: [], condensed: false, totalNodes: 0, visibleNodes: 0 };
    }
    return projectAtlasGraph(graph, { searchQuery });
  }, [graph, searchQuery]);

  const visibleGroups = useMemo(() => {
    if (!graph) return [];
    const visibleIds = new Set(projection.nodes.map((node) => node.id));
    return listVisibleGroups(graph, visibleIds);
  }, [graph, projection.nodes]);

  const selectedNode = useMemo(() => {
    if (!graph || !selectedNodeId) return null;
    return findGraphNode(graph, selectedNodeId);
  }, [graph, selectedNodeId]);

  const selectedCluster = useMemo(() => {
    if (!selectedGroupId) return null;
    return visibleGroups.find((group) => group.id === selectedGroupId) ?? null;
  }, [selectedGroupId, visibleGroups]);

  const handleSelectNode = (nodeId: string) => {
    setSelectedNodeId(nodeId);
    setSelectedGroupId(null);
  };

  const handleSelectGroup = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedNodeId(null);
  };

  useEffect(() => {
    const visibleIds = new Set(projection.nodes.map((node) => node.id));
    if (selectedNodeId && !visibleIds.has(selectedNodeId)) {
      setSelectedNodeId(null);
    }
    if (selectedGroupId && !visibleGroups.some((group) => group.id === selectedGroupId)) {
      setSelectedGroupId(null);
    }
  }, [projection.nodes, selectedGroupId, selectedNodeId, visibleGroups]);

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
    <BlueprintViewLayout
      controls={
        <AtlasControls
          searchQuery={searchQuery}
          totalNodes={projection.totalNodes}
          visibleNodes={projection.visibleNodes}
          condensed={projection.condensed}
          nodes={projection.nodes}
          groups={visibleGroups}
          selectedNodeId={selectedNodeId}
          selectedGroupId={selectedGroupId}
          onSearchChange={setSearchQuery}
          onResetSearch={() => setSearchQuery("")}
          onSelectNode={handleSelectNode}
          onSelectGroup={handleSelectGroup}
        />
      }
      canvas={
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
      }
      inspector={<AtlasInspector graph={graph} node={selectedNode} cluster={selectedCluster} />}
    />
  );
}
