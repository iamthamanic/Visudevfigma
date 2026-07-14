/**
 * Builds stack cards from contains-edges for the active grouping mode.
 */

import type { SoftwareGraph, SoftwareGraphNode, SoftwareGraphNodeKind } from "../../types";
import { resolveLayerType, type ArchitectureLayerType } from "./architecture-layer-accents.js";

export interface ArchitectureStackCard {
  id: string;
  label: string;
  kind: SoftwareGraphNodeKind;
  layerType: ArchitectureLayerType | "unknown";
  domainTag: string | null;
  services: string[];
  filePath: string | null;
}

const CANONICAL_LAYER_ORDER = [
  "experience layer",
  "application layer",
  "domain layer",
  "integration layer",
  "persistence layer",
  "processing layer",
  "platform layer",
];

function layerSortIndex(label: string): number {
  const normalized = label.trim().toLowerCase();
  const index = CANONICAL_LAYER_ORDER.indexOf(normalized);
  return index >= 0 ? index : CANONICAL_LAYER_ORDER.length;
}

export function buildArchitectureStackCards(
  graph: SoftwareGraph,
  stackKind: SoftwareGraphNodeKind,
): ArchitectureStackCard[] {
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph.edges) ? graph.edges : [];
  const nodeById = new Map(nodes.map((node) => [node.id, node]));

  const childrenByParentId = new Map<string, string[]>();
  const parentByChildId = new Map<string, string>();
  for (const edge of edges) {
    if (edge.kind !== "contains") continue;
    const siblings = childrenByParentId.get(edge.sourceId);
    if (siblings) siblings.push(edge.targetId);
    else childrenByParentId.set(edge.sourceId, [edge.targetId]);
    parentByChildId.set(edge.targetId, edge.sourceId);
  }

  return nodes
    .filter((node) => node.kind === stackKind)
    .map((node) => {
      const childIds = childrenByParentId.get(node.id) ?? [];
      const services = childIds
        .map((childId) => nodeById.get(childId))
        .filter((child): child is SoftwareGraphNode => child != null)
        .map((child) => child.label);

      const parentId = parentByChildId.get(node.id);
      const parent = parentId ? nodeById.get(parentId) : undefined;
      const domainTag =
        parent?.kind === "domain" ? parent.label : parent?.kind === "layer" ? parent.label : null;
      const filePath = typeof node.metadata?.filePath === "string" ? node.metadata.filePath : null;

      return {
        id: node.id,
        label: node.label,
        kind: node.kind,
        layerType: node.kind === "layer" ? resolveLayerType(node.label) : "unknown",
        domainTag,
        services,
        filePath,
      };
    })
    .sort((left, right) => {
      if (stackKind === "layer") {
        const byLayer = layerSortIndex(left.label) - layerSortIndex(right.label);
        if (byLayer !== 0) return byLayer;
      }
      return left.label.localeCompare(right.label);
    });
}
