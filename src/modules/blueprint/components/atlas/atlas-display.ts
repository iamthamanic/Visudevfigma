/**
 * Atlas display helpers — kind labels, dependencies, clusters, deployment hints.
 */

import type { SoftwareGraph, SoftwareGraphGroup, SoftwareGraphNode } from "../../types";

export const ATLAS_KIND_LABELS: Record<string, string> = {
  organization: "Organisation",
  application: "Anwendung",
  domain: "Domain",
  layer: "Layer",
  module: "Modul",
  route: "Route",
  service: "Service",
  repository: "Repository",
  table: "Datenbank",
  external: "Extern",
  file: "Datei",
  symbol: "Symbol",
  runtime: "Laufzeit",
};

export function atlasKindLabel(kind: string): string {
  return ATLAS_KIND_LABELS[kind] ?? kind;
}

export function findGraphNode(graph: SoftwareGraph, nodeId: string): SoftwareGraphNode | null {
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  return nodes.find((node) => node.id === nodeId) ?? null;
}

export function listOutgoingDependencies(graph: SoftwareGraph, nodeId: string): string[] {
  const edges = Array.isArray(graph.edges) ? graph.edges : [];
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const nodeById = new Map(nodes.map((entry) => [entry.id, entry]));

  return edges
    .filter(
      (edge) => edge.sourceId === nodeId && edge.kind !== "contains" && nodeById.has(edge.targetId),
    )
    .map((edge) => {
      const target = nodeById.get(edge.targetId);
      return target ? `${edge.kind} → ${target.label}` : edge.kind;
    });
}

export function listIncomingDependencies(graph: SoftwareGraph, nodeId: string): string[] {
  const edges = Array.isArray(graph.edges) ? graph.edges : [];
  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const nodeById = new Map(nodes.map((entry) => [entry.id, entry]));

  return edges
    .filter(
      (edge) => edge.targetId === nodeId && edge.kind !== "contains" && nodeById.has(edge.sourceId),
    )
    .map((edge) => {
      const source = nodeById.get(edge.sourceId);
      return source ? `${source.label} → ${edge.kind}` : edge.kind;
    });
}

export function findGroupsForNode(graph: SoftwareGraph, nodeId: string): SoftwareGraphGroup[] {
  const groups = Array.isArray(graph.groups) ? graph.groups : [];
  return groups.filter((group) => group.nodeIds.includes(nodeId));
}

export function listVisibleGroups(
  graph: SoftwareGraph,
  visibleNodeIds: Set<string>,
): SoftwareGraphGroup[] {
  const groups = Array.isArray(graph.groups) ? graph.groups : [];
  return groups.filter((group) => group.nodeIds.some((id) => visibleNodeIds.has(id)));
}

export function listDeploymentHints(graph: SoftwareGraph, node: SoftwareGraphNode): string[] {
  const hints = new Set<string>();
  const metadataRuntime = node.metadata.runtime;
  if (typeof metadataRuntime === "string" && metadataRuntime.trim()) {
    hints.add(metadataRuntime);
  }

  for (const group of findGroupsForNode(graph, node.id)) {
    if (group.label.trim()) {
      hints.add(group.label);
    }
  }

  const nodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const edges = Array.isArray(graph.edges) ? graph.edges : [];
  const runtimeNodes = nodes.filter((entry) => entry.kind === "runtime");

  for (const runtimeNode of runtimeNodes) {
    const runtimes = runtimeNode.metadata.runtimes;
    if (Array.isArray(runtimes)) {
      for (const runtime of runtimes) {
        if (typeof runtime === "string" && runtime.trim()) {
          hints.add(runtime);
        }
      }
    }

    const linked = edges.some(
      (edge) =>
        (edge.sourceId === node.id && edge.targetId === runtimeNode.id) ||
        (edge.targetId === node.id && edge.sourceId === runtimeNode.id),
    );
    if (linked) {
      hints.add(runtimeNode.label);
    }
  }

  return [...hints];
}
