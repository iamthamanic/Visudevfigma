import { lazy, Suspense, useMemo } from "react";
import type { BlueprintData } from "../types";
import { projectInfrastructureGraph } from "./infrastructure/_projection.js";
import styles from "../styles/InfrastructureView.module.css";

/** Cytoscape (~490kB) loads only when this tab renders — not on Blueprint shell mount. */
const GraphCanvas = lazy(() =>
  import("../../../components/GraphCanvas").then((module) => ({ default: module.GraphCanvas })),
);

interface InfrastructureViewProps {
  blueprint: BlueprintData;
}

export function InfrastructureView({ blueprint }: InfrastructureViewProps) {
  const graph = blueprint.graph;

  const { nodes, edges } = useMemo(() => {
    if (!graph) return { nodes: [], edges: [] };
    return projectInfrastructureGraph(graph);
  }, [graph]);

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
    <div className={styles.root}>
      <Suspense fallback={<p className={styles.loading}>Graph wird geladen...</p>}>
        <GraphCanvas nodes={nodes} edges={edges} />
      </Suspense>
    </div>
  );
}
