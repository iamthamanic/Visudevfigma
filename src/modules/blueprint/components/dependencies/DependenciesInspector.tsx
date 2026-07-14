/**
 * DependenciesInspector — routes to node, edge, or empty inspector panels.
 */

import type {
  SoftwareGraph,
  SoftwareGraphEdge,
  SoftwareGraphEvidence,
  SoftwareGraphNode,
} from "../../types";
import type { DependencyKindCount, TopNodeDependency } from "./_projection.js";
import { DependenciesEdgeInspector } from "./DependenciesEdgeInspector.js";
import { DependenciesEmptyInspector } from "./DependenciesEmptyInspector.js";
import { DependenciesNodeInspector } from "./DependenciesNodeInspector.js";

export interface DependenciesInspectorProps {
  graph: SoftwareGraph;
  nodeById: Map<string, SoftwareGraphNode>;
  topDependencies: DependencyKindCount[];
  selectedNode: SoftwareGraphNode | null;
  selectedEdge: SoftwareGraphEdge | null;
  selectedEvidence: SoftwareGraphEvidence[];
  incomingCount: number;
  outgoingCount: number;
  topNodeDependencies: TopNodeDependency[];
}

export function DependenciesInspector({
  graph,
  nodeById,
  topDependencies,
  selectedNode,
  selectedEdge,
  selectedEvidence,
  incomingCount,
  outgoingCount,
  topNodeDependencies,
}: DependenciesInspectorProps): JSX.Element {
  if (selectedNode) {
    return (
      <DependenciesNodeInspector
        node={selectedNode}
        analyzedAt={graph.analyzedAt}
        incomingCount={incomingCount}
        outgoingCount={outgoingCount}
        neighbors={topNodeDependencies}
      />
    );
  }

  if (selectedEdge) {
    const sourceLabel = nodeById.get(selectedEdge.sourceId)?.label ?? selectedEdge.sourceId;
    const targetLabel = nodeById.get(selectedEdge.targetId)?.label ?? selectedEdge.targetId;

    return (
      <DependenciesEdgeInspector
        sourceLabel={sourceLabel}
        targetLabel={targetLabel}
        edge={selectedEdge}
        evidence={selectedEvidence}
      />
    );
  }

  return <DependenciesEmptyInspector topDependencies={topDependencies} />;
}
