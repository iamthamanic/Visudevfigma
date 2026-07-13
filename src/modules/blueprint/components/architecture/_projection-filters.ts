/**
 * Filters and containment helpers for architecture graph projection.
 */

import type { SoftwareGraphEdge, SoftwareGraphNode, SoftwareGraphNodeKind } from "../../types";
import { ARCHITECTURE_NODE_KINDS, DEFAULT_VISIBLE_KINDS } from "./_projection.constants.js";

export function buildContainsChildrenByParentId(
  softwareGraphEdges: SoftwareGraphEdge[],
): Map<string, string[]> {
  const containsChildrenByParentId = new Map<string, string[]>();
  for (const softwareGraphEdge of softwareGraphEdges) {
    if (softwareGraphEdge.kind !== "contains") continue;
    const childIds = containsChildrenByParentId.get(softwareGraphEdge.sourceId) ?? [];
    childIds.push(softwareGraphEdge.targetId);
    containsChildrenByParentId.set(softwareGraphEdge.sourceId, childIds);
  }
  return containsChildrenByParentId;
}

export function buildContainsParentByChildId(
  softwareGraphEdges: SoftwareGraphEdge[],
): Map<string, string> {
  const containsParentByChildId = new Map<string, string>();
  for (const softwareGraphEdge of softwareGraphEdges) {
    if (softwareGraphEdge.kind !== "contains") continue;
    if (!containsParentByChildId.has(softwareGraphEdge.targetId)) {
      containsParentByChildId.set(softwareGraphEdge.targetId, softwareGraphEdge.sourceId);
    }
  }
  return containsParentByChildId;
}

export function collectHiddenDescendantIds(
  collapsedScopeIds: Set<string>,
  containsChildrenByParentId: Map<string, string[]>,
): Set<string> {
  const hiddenDescendantIds = new Set<string>();
  const visitedScopeIds = new Set<string>(collapsedScopeIds);
  const pendingChildIds: string[] = [];
  for (const collapsedScopeId of collapsedScopeIds) {
    for (const childId of containsChildrenByParentId.get(collapsedScopeId) ?? []) {
      pendingChildIds.push(childId);
    }
  }
  while (pendingChildIds.length > 0) {
    const descendantId = pendingChildIds.pop();
    if (!descendantId || visitedScopeIds.has(descendantId)) continue;
    visitedScopeIds.add(descendantId);
    hiddenDescendantIds.add(descendantId);
    for (const childId of containsChildrenByParentId.get(descendantId) ?? []) {
      pendingChildIds.push(childId);
    }
  }
  return hiddenDescendantIds;
}

export function selectVisibleArchitectureNodes(
  softwareGraphNodes: SoftwareGraphNode[],
  visibleKinds: Set<SoftwareGraphNodeKind>,
  hiddenDescendantIds: Set<string>,
): SoftwareGraphNode[] {
  return softwareGraphNodes.filter(
    (softwareGraphNode) =>
      ARCHITECTURE_NODE_KINDS.includes(softwareGraphNode.kind) &&
      visibleKinds.has(softwareGraphNode.kind) &&
      !hiddenDescendantIds.has(softwareGraphNode.id),
  );
}

export function resolveVisibleKinds(
  visibleKinds: Set<SoftwareGraphNodeKind> | undefined,
): Set<SoftwareGraphNodeKind> {
  return visibleKinds ?? new Set(DEFAULT_VISIBLE_KINDS);
}
