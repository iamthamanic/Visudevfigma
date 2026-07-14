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
  type TopologyEnvFilter,
  type TopologyRegionFilter,
} from "./infrastructure/build-topology.js";
import { projectInfrastructureGraph } from "./infrastructure/_projection.js";
import styles from "../styles/InfrastructureView.module.css";

interface InfrastructureViewProps {
  blueprint: BlueprintData;
}

export function InfrastructureView({ blueprint }: InfrastructureViewProps) {
  const graph = blueprint.graph;
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [activeEnv, setActiveEnv] = useState<TopologyEnvFilter | null>(null);
  const [activeRegion, setActiveRegion] = useState<TopologyRegionFilter | null>(null);

  const { nodes, edges } = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };
    return projectInfrastructureGraph(graph);
  }, [graph]);

  const topologyNodes = useMemo(() => buildTopologyNodes(nodes), [nodes]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  );

  const filtersActive = Boolean(activeEnv || activeRegion);

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
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
        />
      }
      canvas={
        <div className={styles.canvasWrap}>
          <InfrastructureTopologyFilters
            activeEnv={activeEnv}
            activeRegion={activeRegion}
            onSelectEnv={setActiveEnv}
            onSelectRegion={setActiveRegion}
          />
          {filtersActive ? (
            <p className={styles.filterHint}>
              Umgebungs- und Regionsfilter sind UI-Platzhalter — Graph-Metadaten folgen in einer
              späteren Phase.
            </p>
          ) : null}
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
      inspector={<InfrastructureInspector node={selectedNode} />}
    />
  );
}
