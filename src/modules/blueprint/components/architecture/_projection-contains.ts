/**
 * Contains-edge bridging for architecture graph projection.
 */

import type { GraphCanvasEdge, SoftwareGraphNode } from "../../types";

export function buildVisibleAncestorByNodeId(
  softwareGraphNodes: SoftwareGraphNode[],
  visibleArchitectureNodeIds: Set<string>,
  containsParentByChildId: Map<string, string>,
  containsChildrenByParentId: Map<string, string[]>,
): Map<string, string | undefined> {
  const visibleAncestorByNodeId = new Map<string, string | undefined>();
  const scopedNodeIds = new Set(
    softwareGraphNodes.map((softwareGraphNode) => softwareGraphNode.id),
  );
  for (const childId of containsParentByChildId.keys()) {
    scopedNodeIds.add(childId);
  }

  const inDegreeByNodeId = new Map<string, number>();
  for (const scopedNodeId of scopedNodeIds) {
    const parentScopeId = containsParentByChildId.get(scopedNodeId);
    inDegreeByNodeId.set(scopedNodeId, parentScopeId && scopedNodeIds.has(parentScopeId) ? 1 : 0);
  }

  const topologicalQueue: string[] = [];
  for (const [scopedNodeId, inDegree] of inDegreeByNodeId) {
    if (inDegree === 0) topologicalQueue.push(scopedNodeId);
  }

  for (let queueIndex = 0; queueIndex < topologicalQueue.length; queueIndex += 1) {
    const scopedNodeId = topologicalQueue[queueIndex];
    const parentScopeId = containsParentByChildId.get(scopedNodeId);
    let visibleAncestorId: string | undefined;
    if (!parentScopeId) {
      visibleAncestorId = undefined;
    } else if (visibleArchitectureNodeIds.has(parentScopeId)) {
      visibleAncestorId = parentScopeId;
    } else {
      visibleAncestorId = visibleAncestorByNodeId.get(parentScopeId);
    }
    visibleAncestorByNodeId.set(scopedNodeId, visibleAncestorId);

    for (const childScopeId of containsChildrenByParentId.get(scopedNodeId) ?? []) {
      if (!scopedNodeIds.has(childScopeId)) continue;
      const nextInDegree = (inDegreeByNodeId.get(childScopeId) ?? 1) - 1;
      inDegreeByNodeId.set(childScopeId, nextInDegree);
      if (nextInDegree === 0) {
        topologicalQueue.push(childScopeId);
      }
    }
  }

  for (const scopedNodeId of scopedNodeIds) {
    if (!visibleAncestorByNodeId.has(scopedNodeId)) {
      visibleAncestorByNodeId.set(scopedNodeId, undefined);
    }
  }

  return visibleAncestorByNodeId;
}

export function bridgeVisibleContainsEdges(
  visibleArchitectureNodes: SoftwareGraphNode[],
  containsParentByChildId: Map<string, string>,
  containsChildrenByParentId: Map<string, string[]>,
): GraphCanvasEdge[] {
  const visibleArchitectureNodeIds = new Set(
    visibleArchitectureNodes.map((softwareGraphNode) => softwareGraphNode.id),
  );
  const visibleAncestorByNodeId = buildVisibleAncestorByNodeId(
    visibleArchitectureNodes,
    visibleArchitectureNodeIds,
    containsParentByChildId,
    containsChildrenByParentId,
  );
  const bridgedContainsEdges = new Map<string, GraphCanvasEdge>();

  for (const visibleArchitectureNode of visibleArchitectureNodes) {
    const visibleAncestorId = visibleAncestorByNodeId.get(visibleArchitectureNode.id);
    if (!visibleAncestorId || visibleAncestorId === visibleArchitectureNode.id) continue;
    const bridgedEdgeId = `arch:bridge:${visibleAncestorId}:${visibleArchitectureNode.id}`;
    if (bridgedContainsEdges.has(bridgedEdgeId)) continue;
    bridgedContainsEdges.set(bridgedEdgeId, {
      id: bridgedEdgeId,
      source: visibleAncestorId,
      target: visibleArchitectureNode.id,
      kind: "contains",
      label: "contains",
    });
  }

  return [...bridgedContainsEdges.values()];
}
