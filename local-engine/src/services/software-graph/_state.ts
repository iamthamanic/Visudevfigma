/**
 * Mutable builder state and limit-aware add helpers.
 */

import type {
  SoftwareGraphEdge,
  SoftwareGraphEvidence,
  SoftwareGraphNode,
  SoftwareGraphScope,
} from "../../types/api.types.js";
import type { IdRegistry } from "./_types.js";

export interface GraphBuilderState {
  scopes: Map<string, SoftwareGraphScope>;
  nodes: Map<string, SoftwareGraphNode>;
  edges: Map<string, SoftwareGraphEdge>;
  evidence: SoftwareGraphEvidence[];
  registry: IdRegistry;
  nodeCount: number;
  edgeCount: number;
  attemptedNodes: number;
  attemptedEdges: number;
  condensed: boolean;
}

export const DEFAULT_LIMITS = { maxNodes: 2500, maxEdges: 5000 };

export function createBuilderState(): GraphBuilderState {
  return {
    scopes: new Map(),
    nodes: new Map(),
    edges: new Map(),
    evidence: [],
    registry: { nodes: new Set(), edges: new Set(), scopes: new Set() },
    nodeCount: 0,
    edgeCount: 0,
    attemptedNodes: 0,
    attemptedEdges: 0,
    condensed: false,
  };
}

function canAddNode(state: GraphBuilderState): boolean {
  if (state.condensed) return false;
  if (state.attemptedNodes >= DEFAULT_LIMITS.maxNodes) {
    state.condensed = true;
    return false;
  }
  return true;
}

function canAddEdge(state: GraphBuilderState): boolean {
  if (state.condensed) return false;
  if (state.attemptedEdges >= DEFAULT_LIMITS.maxEdges) {
    state.condensed = true;
    return false;
  }
  return true;
}

export function addNode(state: GraphBuilderState, node: SoftwareGraphNode): void {
  state.attemptedNodes += 1;
  if (!canAddNode(state)) return;
  state.nodes.set(node.id, node);
  state.nodeCount += 1;
}

export function addEdge(state: GraphBuilderState, edge: SoftwareGraphEdge): void {
  state.attemptedEdges += 1;
  if (!canAddEdge(state)) return;
  state.edges.set(edge.id, edge);
  state.edgeCount += 1;
}

export function addScope(state: GraphBuilderState, scope: SoftwareGraphScope): void {
  if (!state.scopes.has(scope.id)) {
    state.scopes.set(scope.id, scope);
  }
}
