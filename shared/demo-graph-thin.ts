/**
 * Thin-graph detection and demo merge orchestration.
 * Location: shared/demo-graph-thin.ts
 */

import type { SoftwareGraph } from "./software-graph.types.js";
import { buildHrToolDemoGraph } from "./demo-graph-seed.js";

export const DEMO_GRAPH_MIN_LAYERS = 7;
const MIN_NODES = 20;
const MIN_EDGES = 10;
const MIN_SNAPSHOTS = 3;

export function isThinSoftwareGraph(graph: SoftwareGraph | null | undefined): boolean {
  if (!graph) return true;
  const layerCount = graph.nodes.filter((node) => node.kind === "layer").length;
  if (layerCount < DEMO_GRAPH_MIN_LAYERS) return true;
  if (graph.nodes.length < MIN_NODES) return true;
  if ((graph.edges?.length ?? 0) < MIN_EDGES) return true;
  if ((graph.snapshots?.length ?? 0) < MIN_SNAPSHOTS) return true;
  if ((graph.groups?.length ?? 0) === 0) return true;
  return false;
}

/** Merge demo nodes/edges into an existing graph without clobbering real ids. */
export function mergeDemoGraphEnrichment(
  graph: SoftwareGraph | null | undefined,
  projectId: string,
): SoftwareGraph {
  const demo = buildHrToolDemoGraph(projectId);
  if (!graph) return demo;

  const existingNodeIds = new Set(graph.nodes.map((node) => node.id));
  const existingEdgeIds = new Set(graph.edges.map((edge) => edge.id));

  const mergedNodes = [
    ...graph.nodes,
    ...demo.nodes.filter((node) => !existingNodeIds.has(node.id)),
  ];
  const mergedEdges = [
    ...graph.edges,
    ...demo.edges.filter((edge) => !existingEdgeIds.has(edge.id)),
  ];

  const snapshotIds = new Set((graph.snapshots ?? []).map((snapshot) => snapshot.id));
  const mergedSnapshots = [
    ...(graph.snapshots ?? []),
    ...(demo.snapshots ?? []).filter((snapshot) => !snapshotIds.has(snapshot.id)),
  ];

  return {
    ...graph,
    nodes: mergedNodes,
    edges: mergedEdges,
    groups: graph.groups.length > 0 ? graph.groups : demo.groups,
    evidence: graph.evidence.length > 0 ? graph.evidence : demo.evidence,
    metrics: graph.metrics.length > 0 ? graph.metrics : demo.metrics,
    snapshots: mergedSnapshots.length > 0 ? mergedSnapshots : demo.snapshots,
    scopes: graph.scopes.length > 0 ? graph.scopes : demo.scopes,
  };
}

export function enrichSoftwareGraphIfThin(graph: SoftwareGraph, projectId: string): SoftwareGraph {
  const safeProjectId =
    typeof projectId === "string" && projectId.length > 0 && projectId.length <= 128
      ? projectId
      : "demo-project";
  if (!isThinSoftwareGraph(graph)) return graph;
  return mergeDemoGraphEnrichment(graph, safeProjectId);
}
