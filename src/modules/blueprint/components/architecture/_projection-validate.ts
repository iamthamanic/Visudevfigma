/**
 * Sanitizes SoftwareGraph input before architecture projection so malformed
 * analyzer output cannot crash the view or produce dangling Cytoscape edges.
 */

import type {
  SoftwareGraph,
  SoftwareGraphEdge,
  SoftwareGraphNode,
  SoftwareGraphNodeKind,
} from "../../types";

const VALID_SOFTWARE_GRAPH_NODE_KINDS = new Set<SoftwareGraphNodeKind>([
  "organization",
  "application",
  "domain",
  "layer",
  "module",
  "route",
  "service",
  "repository",
  "table",
  "external",
  "file",
  "symbol",
  "runtime",
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object";
}

function isValidArchitectureNodeId(nodeId: unknown): nodeId is string {
  return typeof nodeId === "string" && nodeId.length > 0 && nodeId.length <= 256;
}

function isValidArchitectureNode(value: unknown): value is SoftwareGraphNode {
  if (!isRecord(value)) return false;
  return (
    isValidArchitectureNodeId(value.id) &&
    typeof value.kind === "string" &&
    VALID_SOFTWARE_GRAPH_NODE_KINDS.has(value.kind as SoftwareGraphNodeKind)
  );
}

function isValidArchitectureEdge(value: unknown): value is SoftwareGraphEdge {
  if (!isRecord(value)) return false;
  return (
    typeof value.id === "string" &&
    value.id.length > 0 &&
    typeof value.kind === "string" &&
    isValidArchitectureNodeId(value.sourceId) &&
    isValidArchitectureNodeId(value.targetId)
  );
}

function readSoftwareGraphNodes(nodes: unknown): SoftwareGraphNode[] {
  if (!Array.isArray(nodes)) return [];
  return nodes.filter(isValidArchitectureNode);
}

function readSoftwareGraphEdges(edges: unknown): SoftwareGraphEdge[] {
  if (!Array.isArray(edges)) return [];
  return edges.filter(isValidArchitectureEdge);
}

export function sanitizeArchitectureLabel(label: unknown): string {
  if (typeof label !== "string") return "(unbenannt)";
  const trimmedLabel = label.trim();
  if (trimmedLabel.length === 0) return "(unbenannt)";
  return trimmedLabel;
}

export function sanitizeSoftwareGraphForArchitecture(softwareGraph: SoftwareGraph): SoftwareGraph {
  const validNodeIds = new Set<string>();
  const sanitizedNodes = readSoftwareGraphNodes(softwareGraph.nodes).map((softwareGraphNode) => {
    validNodeIds.add(softwareGraphNode.id);
    return {
      ...softwareGraphNode,
      label: sanitizeArchitectureLabel(softwareGraphNode.label),
    };
  });

  const sanitizedEdges = readSoftwareGraphEdges(softwareGraph.edges).filter(
    (softwareGraphEdge) =>
      validNodeIds.has(softwareGraphEdge.sourceId) && validNodeIds.has(softwareGraphEdge.targetId),
  );

  return {
    ...softwareGraph,
    nodes: sanitizedNodes,
    edges: sanitizedEdges,
  };
}
