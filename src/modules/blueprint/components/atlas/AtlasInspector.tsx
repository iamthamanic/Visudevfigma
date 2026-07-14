/**
 * Right-hand Inspektor for AtlasView with sub-tabbed node/cluster details.
 */

import type { SoftwareGraph, SoftwareGraphGroup, SoftwareGraphNode } from "../../types";
import { InspectorPanel } from "../ui/InspectorPanel.js";
import { atlasKindLabel } from "./atlas-display.js";
import { AtlasInspectorTabs } from "./AtlasInspectorTabs.js";

export interface AtlasInspectorProps {
  graph: SoftwareGraph;
  node: SoftwareGraphNode | null;
  cluster: SoftwareGraphGroup | null;
}

export function AtlasInspector({ graph, node, cluster }: AtlasInspectorProps): JSX.Element {
  if (!node && !cluster) {
    return (
      <InspectorPanel
        title="Keine Auswahl"
        emptyMessage="Wähle einen Knoten oder Cluster, um Übersicht und Abhängigkeiten zu sehen."
      />
    );
  }

  const title = cluster?.label ?? node?.label ?? "—";
  const subtitle = atlasKindLabel(cluster?.kind ?? node?.kind ?? "—");

  return (
    <InspectorPanel title={title} subtitle={subtitle}>
      <AtlasInspectorTabs graph={graph} node={node} cluster={cluster} />
    </InspectorPanel>
  );
}
