/**
 * InfrastructureView — topology diagram Internet→LB→Services→DB with filters and legend.
 */

import { useMemo, useState } from "react";
import type { BlueprintData } from "../types";
import { BlueprintViewLayout } from "./ui/BlueprintViewLayout.js";
import { InfrastructureConnectionLegend } from "./infrastructure/InfrastructureConnectionLegend.js";
import { InfrastructureInspector } from "./infrastructure/InfrastructureInspector.js";
import { InfrastructureServiceList } from "./infrastructure/InfrastructureServiceList.js";
import { InfrastructureTopologyDiagram } from "./infrastructure/InfrastructureTopologyDiagram.js";
import { InfrastructureTopologyFilters } from "./infrastructure/InfrastructureTopologyFilters.js";
import {
  buildTopologyNodes,
  filterProjectedNodesByDeployment,
  type TopologyEnvFilter,
  type TopologyRegionFilter,
  type TopologyViewFilter,
} from "./infrastructure/build-topology.js";
import { projectInfrastructureGraph } from "./infrastructure/_projection.js";
import styles from "../styles/InfrastructureView.module.css";

interface InfrastructureViewProps {
  blueprint: BlueprintData;
}

export function InfrastructureView({ blueprint }: InfrastructureViewProps) {
  const graph = blueprint.graph;
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeEnv, setActiveEnv] = useState<TopologyEnvFilter | null>("Produktion");
  const [activeRegion, setActiveRegion] = useState<TopologyRegionFilter | null>("eu-central-1");
  const [activeView, setActiveView] = useState<TopologyViewFilter | null>("Logische Topologie");
  const [refreshTick, setRefreshTick] = useState(0);

  const { nodes, edges } = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };
    return projectInfrastructureGraph(graph);
  }, [graph]);

  const filteredNodes = useMemo(() => {
    if (!graph) return [];
    return filterProjectedNodesByDeployment(nodes, graph, activeEnv, activeRegion);
  }, [nodes, graph, activeEnv, activeRegion]);

  const topologyNodes = useMemo(() => buildTopologyNodes(filteredNodes), [filteredNodes]);

  const selectedNode = useMemo(
    () => filteredNodes.find((node) => node.id === selectedNodeId) ?? null,
    [filteredNodes, selectedNodeId],
  );

  const selectedGraphNode = useMemo(
    () => graph?.nodes.find((node) => node.id === selectedNodeId) ?? null,
    [graph, selectedNodeId],
  );

  if (!graph || nodes.length === 0) {
    return (
      <div className={styles.empty}>
        <p className={styles.emptyTitle}>Keine Infrastruktur-Daten</p>
        <p className={styles.emptyHint}>
          Starte eine neue Blueprint-Analyse, um den Software Graph zu erzeugen.
        </p>
      </div>
    );
  }

  return (
    <BlueprintViewLayout
      controls={
        <InfrastructureServiceList
          nodes={filteredNodes}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
        />
      }
      canvas={
        <div className={styles.canvasWrap} key={refreshTick}>
          <InfrastructureTopologyFilters
            activeEnv={activeEnv}
            activeRegion={activeRegion}
            activeView={activeView}
            onSelectEnv={setActiveEnv}
            onSelectRegion={setActiveRegion}
            onSelectView={setActiveView}
            onRefresh={() => setRefreshTick((tick) => tick + 1)}
          />
          <InfrastructureTopologyDiagram
            nodes={topologyNodes}
            selectedNodeId={selectedNodeId}
            onSelectNode={setSelectedNodeId}
          />
          <InfrastructureConnectionLegend />
          {edges.length > 0 ? (
            <p className={styles.topologyMeta}>{edges.length} Verbindungen im Graph</p>
          ) : null}
        </div>
      }
      inspector={
        <InfrastructureInspector
          node={selectedNode}
          graphNode={selectedGraphNode}
          edges={edges}
          nodes={filteredNodes}
        />
      }
    />
  );
}
