/**
 * Builds stack cards from contains-edges for the active grouping mode.
 */

import type { SoftwareGraph, SoftwareGraphNode, SoftwareGraphNodeKind } from "../../types";

export interface ArchitectureStackCard {
  id: string;
  label: string;
  kind: SoftwareGraphNodeKind;
  services: string[];
}

export function buildArchitectureStackCards(
  graph: SoftwareGraph,
  stackKind: SoftwareGraphNodeKind,
): ArchitectureStackCard[] {
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph.edges) ? graph.edges : [];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const childrenByParentId = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.kind !== "contains") continue;
    const siblings = childrenByParentId.get(edge.sourceId);
    if (siblings) siblings.push(edge.targetId);
    else childrenByParentId.set(edge.sourceId, [edge.targetId]);
  }

  return nodes
    .filter((node) => node.kind === stackKind)
    .map((node) => {
      const childIds = childrenByParentId.get(node.id) ?? [];
      const services = childIds
        .map((childId) => nodeById.get(childId))
        .filter((child): child is SoftwareGraphNode => child != null)
        .map((child) => child.label);

      return {
        id: node.id,
        label: node.label,
        kind: node.kind,
        services,
      };
    });
}
