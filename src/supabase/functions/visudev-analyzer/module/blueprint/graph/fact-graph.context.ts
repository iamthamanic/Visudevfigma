/** Shared graph build state for VisuDevGraph mappers. */

import type {
  VisuDevEdge,
  VisuDevGraph,
  VisuDevNode,
  VisuDevScope,
} from "../../dto/graph/visudev-graph.dto.ts";
import type { EvidenceIndex } from "./fact-graph-evidence.ts";

export interface GraphBuildContext {
  evidence: EvidenceIndex;
  nodes: VisuDevNode[];
  edges: VisuDevEdge[];
  scopes: VisuDevScope[];
  nodeById: Map<string, VisuDevNode>;
  edgeById: Map<string, VisuDevEdge>;
  idRegistry: Set<string>;
  idStemCounters: Map<string, number>;
  tableByLabel: Map<string, string>;
}

export function createGraphBuildContext(
  evidence: EvidenceIndex,
): GraphBuildContext {
  return {
    evidence,
    nodes: [],
    edges: [],
    scopes: [],
    nodeById: new Map<string, VisuDevNode>(),
    edgeById: new Map<string, VisuDevEdge>(),
    idRegistry: new Set<string>(),
    idStemCounters: new Map<string, number>(),
    tableByLabel: new Map<string, string>(),
  };
}

export function assembleVisuDevGraph(
  ctx: GraphBuildContext,
): VisuDevGraph {
  return {
    version: 1,
    nodes: ctx.nodes,
    edges: ctx.edges,
    evidence: ctx.evidence.list,
    scopes: ctx.scopes,
    findings: [],
  };
}
