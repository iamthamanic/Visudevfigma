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

const DEDUPE_NODE_KINDS = new Set<SoftwareGraphNodeKind>(["domain", "module"]);

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

function readNodeSemanticKey(node: SoftwareGraphNode): string {
  const filePath =
    typeof node.metadata?.filePath === "string" ? node.metadata.filePath.trim().toLowerCase() : "";
  if (filePath.length > 0) return `${node.kind}:${filePath}`;
  return `${node.kind}:${node.id}`;
}

/** Collapse duplicate domain/module nodes that share the same path or semantic label. */
export function dedupeArchitectureNodes(nodes: SoftwareGraphNode[]): {
  nodes: SoftwareGraphNode[];
  idRemap: Map<string, string>;
} {
  const seenKeys = new Map<string, string>();
  const keptIds = new Set<string>();
  const deduped: SoftwareGraphNode[] = [];
  const idRemap = new Map<string, string>();

  for (const node of nodes) {
    if (!DEDUPE_NODE_KINDS.has(node.kind)) {
      deduped.push(node);
      keptIds.add(node.id);
      continue;
    }

    const filePath =
      typeof node.metadata?.filePath === "string" ? node.metadata.filePath.trim() : "";
    const key =
      filePath.length > 0
        ? `${node.kind}:${filePath.toLowerCase()}`
        : `${node.kind}:${node.id}`;

    const keptId = seenKeys.get(key);
    if (keptId) {
      idRemap.set(node.id, keptId);
      continue;
    }

    seenKeys.set(key, node.id);
    keptIds.add(node.id);
    deduped.push(node);
  }

  return { nodes: deduped, idRemap };
}

export function sanitizeSoftwareGraphForArchitecture(softwareGraph: SoftwareGraph): SoftwareGraph {
  const { nodes: dedupedNodes, idRemap } = dedupeArchitectureNodes(
    readSoftwareGraphNodes(softwareGraph.nodes).map((softwareGraphNode) => ({
      ...softwareGraphNode,
      label: sanitizeArchitectureLabel(softwareGraphNode.label),
    })),
  );

  const validNodeIds = new Set(dedupedNodes.map((node) => node.id));

  const remapId = (nodeId: string): string | null => {
    const resolved = idRemap.get(nodeId) ?? nodeId;
    return validNodeIds.has(resolved) ? resolved : null;
  };

  const sanitizedEdges = readSoftwareGraphEdges(softwareGraph.edges)
    .map((edge) => {
      const sourceId = remapId(edge.sourceId);
      const targetId = remapId(edge.targetId);
      if (!sourceId || !targetId || sourceId === targetId) return null;
      return { ...edge, sourceId, targetId };
    })
    .filter((edge): edge is SoftwareGraphEdge => edge != null);

  const edgeKeys = new Set<string>();
  const uniqueEdges = sanitizedEdges.filter((edge) => {
    const key = `${edge.kind}:${edge.sourceId}:${edge.targetId}`;
    if (edgeKeys.has(key)) return false;
    edgeKeys.add(key);
    return true;
  });

  return {
    ...softwareGraph,
    nodes: dedupedNodes,
    edges: uniqueEdges,
  };
}
