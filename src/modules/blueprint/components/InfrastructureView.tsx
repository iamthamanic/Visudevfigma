/**
 * InfrastructureView — runtime topology from SoftwareGraph (services, stores, external deps).
 */

import { lazy, Suspense, useMemo, useState } from "react";
import type { BlueprintData } from "../types";
import { BlueprintViewLayout } from "./ui/BlueprintViewLayout.js";
import { InfrastructureInspector } from "./infrastructure/InfrastructureInspector.js";
import { InfrastructureServiceList } from "./infrastructure/InfrastructureServiceList.js";
import { projectInfrastructureGraph } from "./infrastructure/_projection.js";
import styles from "../styles/InfrastructureView.module.css";

const GraphCanvas = lazy(() =>
  import("../../../components/GraphCanvas").then((module) => ({ default: module.GraphCanvas })),
);

interface InfrastructureViewProps {
  blueprint: BlueprintData;
}

export function InfrastructureView({ blueprint }: InfrastructureViewProps) {
  const graph = blueprint.graph;
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  const { nodes, edges } = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };
    return projectInfrastructureGraph(graph);
  }, [graph]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
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
          nodes={nodes}
          selectedNodeId={selectedNodeId}
          onSelectNode={setSelectedNodeId}
        />
      }
      canvas={
        <div className={styles.canvasWrap}>
          <Suspense fallback={<p className={styles.loading}>Graph wird geladen...</p>}>
            <GraphCanvas nodes={nodes} edges={edges} />
          </Suspense>
        </div>
      }
      inspector={<InfrastructureInspector node={selectedNode} />}
    />
  );
}
