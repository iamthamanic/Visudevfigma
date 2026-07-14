/**
 * Abhängigkeiten tab content for Atlas Inspektor.
 */

import type { SoftwareGraph, SoftwareGraphGroup, SoftwareGraphNode } from "../../types";
import { listIncomingDependencies, listOutgoingDependencies } from "./atlas-display.js";
import styles from "../../styles/AtlasView.module.css";

export interface AtlasInspectorDependenciesTabProps {
  graph: SoftwareGraph;
  node: SoftwareGraphNode | null;
  cluster: SoftwareGraphGroup | null;
}

export function AtlasInspectorDependenciesTab({
  graph,
  node,
  cluster,
}: AtlasInspectorDependenciesTabProps): JSX.Element {
  if (cluster) {
    return (
      <p className={styles.emptyControls}>
        Wähle einen einzelnen Knoten, um eingehende und ausgehende Abhängigkeiten zu sehen.
      </p>
    );
  }

  if (!node) {
    return <p className={styles.emptyControls}>Keine Abhängigkeiten.</p>;
  }

  const outgoing = listOutgoingDependencies(graph, node.id);
  const incoming = listIncomingDependencies(graph, node.id);

  if (outgoing.length === 0 && incoming.length === 0) {
    return <p className={styles.emptyControls}>Keine Abhängigkeiten.</p>;
  }

  return (
    <>
      {outgoing.length > 0 ? (
        <>
          <h4 className={styles.subSectionTitle}>Ausgehend</h4>
          <ul className={styles.checklist}>
            {outgoing.map((dependency) => (
              <li key={dependency}>{dependency}</li>
            ))}
          </ul>
        </>
      ) : null}
      {incoming.length > 0 ? (
        <>
          <h4 className={styles.subSectionTitle}>Eingehend</h4>
          <ul className={styles.checklist}>
            {incoming.map((dependency) => (
              <li key={dependency}>{dependency}</li>
            ))}
          </ul>
        </>
      ) : null}
    </>
  );
}
