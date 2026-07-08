/** VisuDevGraph IR — shared analysis graph for Blueprint. */

import type { FindingSeverity } from "../blueprint/blueprint-document.dto.ts";

export type VisuDevNodeKind =
  | "route"
  | "auth"
  | "validation"
  | "rate-limit"
  | "table"
  | "external_api";

export type VisuDevEdgeKind =
  | "reads"
  | "writes"
  | "validates"
  | "authenticates"
  | "calls"
  | "rate_limits";

export type DetectionState = "confirmed" | "missing" | "unknown";

export interface VisuDevEvidence {
  id: string;
  factId: string;
  subjectType: "node" | "edge" | "scope";
  subjectId: string;
  filePath: string;
  line: number;
  snippet: string;
  summary: string;
}

export interface VisuDevNode {
  id: string;
  kind: VisuDevNodeKind;
  label: string;
  state: DetectionState;
  scopeId?: string;
  filePath?: string;
  line?: number;
  metadata?: Record<string, unknown>;
  evidenceIds: string[];
}

export interface VisuDevEdge {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  kind: VisuDevEdgeKind;
  state: DetectionState;
  scopeId?: string;
  evidenceIds: string[];
  metadata?: Record<string, unknown>;
}

export type VisuDevScopeKind = "route";

export interface VisuDevScope {
  id: string;
  kind: VisuDevScopeKind;
  label: string;
  nodeIds: string[];
  edgeIds: string[];
  metadata?: Record<string, unknown>;
}

export type VisuDevControlKind =
  | "auth"
  | "validation"
  | "rate-limit"
  | "db-write";

export type VisuDevFindingOutcome = "missing" | "not_applicable";

export interface VisuDevFinding {
  id: string;
  ruleId: string;
  scopeId: string;
  controlKind: VisuDevControlKind;
  expectedControlNodeId?: string;
  outcome: VisuDevFindingOutcome;
  message: string;
  expectedState: string;
  actualState: string;
  evidenceIds: string[];
  severity?: FindingSeverity;
}

export interface VisuDevGraph {
  version: 1;
  nodes: VisuDevNode[];
  edges: VisuDevEdge[];
  evidence: VisuDevEvidence[];
  scopes: VisuDevScope[];
  findings: VisuDevFinding[];
}
