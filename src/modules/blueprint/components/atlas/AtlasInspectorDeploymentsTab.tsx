/**
 * Deployments tab content for Atlas Inspektor.
 */

import type { SoftwareGraph, SoftwareGraphGroup, SoftwareGraphNode } from "../../types";
import { listDeploymentHints } from "./atlas-display.js";
import styles from "../../styles/AtlasView.module.css";

export interface AtlasInspectorDeploymentsTabProps {
  graph: SoftwareGraph;
  node: SoftwareGraphNode | null;
  cluster: SoftwareGraphGroup | null;
}

export function AtlasInspectorDeploymentsTab({
  graph,
  node,
  cluster,
}: AtlasInspectorDeploymentsTabProps): JSX.Element {
  if (cluster) {
    return (
      <p className={styles.emptyControls}>
        Deployment-Hinweise sind pro Knoten verfügbar. Wähle einen Knoten im Cluster.
      </p>
    );
  }

  if (!node) {
    return (
      <p className={styles.emptyControls}>
        Keine Deployment- oder Laufzeit-Metadaten im Software Graph.
      </p>
    );
  }

  const deployments = listDeploymentHints(graph, node);
  if (deployments.length === 0) {
    return (
      <p className={styles.emptyControls}>
        Keine Deployment- oder Laufzeit-Metadaten im Software Graph.
      </p>
    );
  }

  return (
    <ul className={styles.checklist}>
      {deployments.map((deployment) => (
        <li key={deployment}>{deployment}</li>
      ))}
    </ul>
  );
}
