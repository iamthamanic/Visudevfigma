/**
 * Maps SoftwareGraph runtime/service nodes into the smaller edge set used by
 * InfrastructureView (hosts, stores-in, external-dependency).
 */

import type {
  GraphCanvasEdge,
  GraphCanvasNode,
  SoftwareGraph,
  SoftwareGraphNode,
} from "../../types";
import { getNodeKindColor, getRuntimeColor } from "./_colors.js";

const INFRA_ID_PREFIX = "infra:v1:";

const infraNodeKinds = new Set<SoftwareGraphNode["kind"]>([
  "runtime",
  "service",
  "external",
  "table",
  "file",
  "route",
]);

interface InfrastructureGraph {
  nodes: GraphCanvasNode[];
  edges: GraphCanvasEdge[];
}

const MAX_RUNTIME_LABEL_LEN = 64;

function readRuntimeLabel(metadata: Record<string, unknown>): string | undefined {
  const runtimeValue = metadata.runtime;
  if (typeof runtimeValue !== "string" || runtimeValue.length === 0) return undefined;
  if (runtimeValue.length > MAX_RUNTIME_LABEL_LEN) return undefined;
  return runtimeValue;
}

function infraRuntimeNodeId(runtime: string): string {
  return `${INFRA_ID_PREFIX}runtime:${runtime}`;
}

function infraHostsEdgeId(fileId: string): string {
  return `${INFRA_ID_PREFIX}edge:hosts:${fileId}`;
}

function infraProjectedEdgeId(edgeId: string): string {
  return `${INFRA_ID_PREFIX}edge:${edgeId}`;
}

function reserveNodeId(nodeIds: Set<string>, node: GraphCanvasNode): boolean {
  if (nodeIds.has(node.id)) return false;
  nodeIds.add(node.id);
  return true;
}

function reserveEdgeId(edgeIds: Set<string>, edge: GraphCanvasEdge): boolean {
  if (edgeIds.has(edge.id)) return false;
  edgeIds.add(edge.id);
  return true;
}

export function projectInfrastructureGraph(graph: SoftwareGraph): InfrastructureGraph {
  const graphNodes = Array.isArray(graph.nodes) ? graph.nodes : [];
  const graphEdges = Array.isArray(graph.edges) ? graph.edges : [];
  const nodeById = new Map(graphNodes.map((graphNode) => [graphNode.id, graphNode]));
  const graphNodeIds = new Set(graphNodes.map((graphNode) => graphNode.id));
  const graphEdgeIds = new Set(graphEdges.map((graphEdge) => graphEdge.id));
  const nodes: GraphCanvasNode[] = [];
  const edges: GraphCanvasEdge[] = [];
  const reservedNodeIds = new Set<string>();
  const reservedEdgeIds = new Set<string>();
  const syntheticRuntimeIds = new Set<string>();

  const runtimes = [
    ...new Set(
      graphNodes
        .filter((graphNode) => graphNode.kind === "file")
        .map((graphNode) => readRuntimeLabel(graphNode.metadata))
        .filter((runtime): runtime is string => runtime != null),
    ),
  ];

  for (const runtime of runtimes) {
    const runtimeNode: GraphCanvasNode = {
      id: infraRuntimeNodeId(runtime),
      label: runtime,
      kind: "runtime",
      color: getRuntimeColor(runtime),
    };
    if (graphNodeIds.has(runtimeNode.id)) continue;
    if (reserveNodeId(reservedNodeIds, runtimeNode)) {
      nodes.push(runtimeNode);
      syntheticRuntimeIds.add(runtimeNode.id);
    }
  }

  for (const graphNode of graphNodes) {
    if (!infraNodeKinds.has(graphNode.kind)) continue;
    const projectedNode: GraphCanvasNode = {
      id: graphNode.id,
      label: graphNode.label,
      kind: graphNode.kind,
      color: getNodeKindColor(graphNode.kind),
    };
    if (reserveNodeId(reservedNodeIds, projectedNode)) {
      nodes.push(projectedNode);
    }
  }

  const fileNodes = graphNodes.filter((graphNode) => graphNode.kind === "file");
  for (const fileNode of fileNodes) {
    const runtime = readRuntimeLabel(fileNode.metadata);
    if (!runtime) continue;
    const runtimeSourceId = infraRuntimeNodeId(runtime);
    if (!syntheticRuntimeIds.has(runtimeSourceId)) continue;
    const hostsEdge: GraphCanvasEdge = {
      id: infraHostsEdgeId(fileNode.id),
      source: runtimeSourceId,
      target: fileNode.id,
      label: "hosts",
      kind: "hosts",
    };
    if (graphEdgeIds.has(hostsEdge.id)) continue;
    if (
      reservedNodeIds.has(hostsEdge.source) &&
      reservedNodeIds.has(hostsEdge.target) &&
      reserveEdgeId(reservedEdgeIds, hostsEdge)
    ) {
      edges.push(hostsEdge);
    }
  }

  for (const graphEdge of graphEdges) {
    if (graphEdge.kind !== "external-dependency" && graphEdge.kind !== "data") continue;
    const sourceNode = nodeById.get(graphEdge.sourceId);
    const targetNode = nodeById.get(graphEdge.targetId);
    if (!sourceNode || !targetNode) continue;
    if (!infraNodeKinds.has(sourceNode.kind) || !infraNodeKinds.has(targetNode.kind)) continue;

    const projectedEdge: GraphCanvasEdge = {
      id: infraProjectedEdgeId(graphEdge.id),
      source: graphEdge.sourceId,
      target: graphEdge.targetId,
      label: graphEdge.kind === "data" ? "stores-in" : "external-dependency",
      kind: graphEdge.kind,
    };
    if (graphEdgeIds.has(projectedEdge.id)) continue;
    if (
      reservedNodeIds.has(projectedEdge.source) &&
      reservedNodeIds.has(projectedEdge.target) &&
      reserveEdgeId(reservedEdgeIds, projectedEdge)
    ) {
      edges.push(projectedEdge);
    }
  }

  return { nodes, edges };
}
