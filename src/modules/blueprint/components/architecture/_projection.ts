/**
 * Maps SoftwareGraph into ArchitectureView nodes and edges.
 * Contains-edges are bridged to the nearest visible ancestor so hidden file nodes
 * do not orphan routes/services/tables.
 */

import type {
  GraphCanvasEdge,
  GraphCanvasNode,
  SoftwareGraph,
  SoftwareGraphEdge,
  SoftwareGraphNode,
  SoftwareGraphNodeKind,
} from "../../types";
import {
  ARCHITECTURE_NODE_KINDS,
  ARCHITECTURE_RELATION_EDGE_KINDS,
  DEFAULT_VISIBLE_KINDS,
  MAX_ARCHITECTURE_LABEL_LEN,
} from "./_projection.constants.js";
import { bridgeVisibleContainsEdges } from "./_projection-contains.js";
import {
  buildContainsChildrenByParentId,
  buildContainsParentByChildId,
  collectHiddenDescendantIds,
  resolveVisibleKinds,
  selectVisibleArchitectureNodes,
} from "./_projection-filters.js";
import {
  sanitizeArchitectureLabel,
  sanitizeSoftwareGraphForArchitecture,
} from "./_projection-validate.js";

export { ARCHITECTURE_NODE_KINDS, DEFAULT_VISIBLE_KINDS };

export interface CollapsibleGroup {
  id: string;
  label: string;
  kind: "domain" | "module";
}

export interface ArchitectureProjectionOptions {
  visibleKinds?: Set<SoftwareGraphNodeKind>;
  collapsedIds?: Set<string>;
}

export interface ArchitectureProjection {
  nodes: GraphCanvasNode[];
  edges: GraphCanvasEdge[];
  collapsible: CollapsibleGroup[];
}

function truncateArchitectureLabel(label: string): string {
  const safeLabel = sanitizeArchitectureLabel(label);
  if (safeLabel.length <= MAX_ARCHITECTURE_LABEL_LEN) return safeLabel;
  return `${safeLabel.slice(0, MAX_ARCHITECTURE_LABEL_LEN - 1)}…`;
}

function toArchitectureCanvasNode(softwareGraphNode: SoftwareGraphNode): GraphCanvasNode {
  return {
    id: softwareGraphNode.id,
    label: truncateArchitectureLabel(softwareGraphNode.label),
    kind: softwareGraphNode.kind,
  };
}

function toArchitectureCanvasEdge(softwareGraphEdge: SoftwareGraphEdge): GraphCanvasEdge {
  return {
    id: softwareGraphEdge.id,
    source: softwareGraphEdge.sourceId,
    target: softwareGraphEdge.targetId,
    kind: softwareGraphEdge.kind,
    label: softwareGraphEdge.kind,
  };
}

function selectNonContainsArchitectureEdges(
  softwareGraphEdges: SoftwareGraphEdge[],
  visibleArchitectureNodeIds: Set<string>,
): SoftwareGraphEdge[] {
  return softwareGraphEdges.filter(
    (softwareGraphEdge) =>
      ARCHITECTURE_RELATION_EDGE_KINDS.has(softwareGraphEdge.kind) &&
      softwareGraphEdge.kind !== "contains" &&
      visibleArchitectureNodeIds.has(softwareGraphEdge.sourceId) &&
      visibleArchitectureNodeIds.has(softwareGraphEdge.targetId),
  );
}

function projectCollapsibleGroups(softwareGraphNodes: SoftwareGraphNode[]): CollapsibleGroup[] {
  return softwareGraphNodes
    .filter(
      (softwareGraphNode) =>
        softwareGraphNode.kind === "domain" || softwareGraphNode.kind === "module",
    )
    .map((softwareGraphNode) => ({
      id: softwareGraphNode.id,
      label: truncateArchitectureLabel(softwareGraphNode.label),
      kind: softwareGraphNode.kind as "domain" | "module",
    }))
    .sort((leftGroup, rightGroup) => leftGroup.label.localeCompare(rightGroup.label));
}

export function projectArchitectureGraph(
  softwareGraph: SoftwareGraph,
  options: ArchitectureProjectionOptions = {},
): ArchitectureProjection {
  const sanitizedSoftwareGraph = sanitizeSoftwareGraphForArchitecture(softwareGraph);
  const visibleKinds = resolveVisibleKinds(options.visibleKinds);
  const collapsedIds = options.collapsedIds ?? new Set<string>();
  const containsChildrenByParentId = buildContainsChildrenByParentId(sanitizedSoftwareGraph.edges);
  const containsParentByChildId = buildContainsParentByChildId(sanitizedSoftwareGraph.edges);
  const hiddenDescendantIds = collectHiddenDescendantIds(collapsedIds, containsChildrenByParentId);
  const visibleArchitectureNodes = selectVisibleArchitectureNodes(
    sanitizedSoftwareGraph.nodes,
    visibleKinds,
    hiddenDescendantIds,
  );
  const visibleArchitectureNodeIds = new Set(
    visibleArchitectureNodes.map((softwareGraphNode) => softwareGraphNode.id),
  );

  return {
    nodes: visibleArchitectureNodes.map(toArchitectureCanvasNode),
    edges: [
      ...bridgeVisibleContainsEdges(
        visibleArchitectureNodes,
        containsParentByChildId,
        containsChildrenByParentId,
      ),
      ...selectNonContainsArchitectureEdges(
        sanitizedSoftwareGraph.edges,
        visibleArchitectureNodeIds,
      ).map(toArchitectureCanvasEdge),
    ],
    collapsible: projectCollapsibleGroups(sanitizedSoftwareGraph.nodes),
  };
}
