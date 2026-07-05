/** Blueprint Engine types — mirrors analyzer BlueprintDocument for UI. */

export type ConceptState =
  | "confirmed"
  | "partial"
  | "weak"
  | "missing"
  | "unknown"
  | "contradictory";

export type FindingSeverity = "info" | "low" | "medium" | "high" | "critical";

export interface BlueprintFinding {
  id: string;
  ruleId: string;
  category: string;
  severity: FindingSeverity;
  scopeId: string;
  message: string;
  expectedState: string;
  actualState: string;
  evidenceFactIds: string[];
  confidence: number;
  remediation?: string;
}

export interface CodeFact {
  id: string;
  kind: string;
  filePath: string;
  line: number;
  snippet: string;
  metadata: Record<string, unknown>;
}

export interface PipelineNode {
  id: string;
  type: string;
  label: string;
  state: ConceptState;
  filePath?: string;
  line?: number;
}

export interface RouteBlueprint {
  id: string;
  method: string;
  path: string;
  filePath: string;
  line: number;
  pipeline: PipelineNode[];
  concepts: Record<string, ConceptState>;
}

export interface SecurityMatrixCell {
  state: ConceptState | "n/a";
}

export interface SecurityMatrixRow {
  routeId: string;
  method: string;
  path: string;
  auth: SecurityMatrixCell;
  role: SecurityMatrixCell;
  validation: SecurityMatrixCell;
  rateLimit: SecurityMatrixCell;
  db: SecurityMatrixCell;
  rls: SecurityMatrixCell;
  audit: SecurityMatrixCell;
  findingCount: number;
}

/** dependency-cruiser-style rule violation (legacy optional). */
export interface RuleViolation {
  ruleId: string;
  severity: "error" | "warn" | "info";
  source: string;
  target?: string;
  message: string;
}

export interface BlueprintCycle {
  nodes: string[];
  message?: string;
}

export interface BlueprintData extends Record<string, unknown> {
  version?: 1;
  projectId?: string;
  updatedAt?: string;
  commitSha?: string;
  analyzedAt?: string;
  routes?: RouteBlueprint[];
  securityMatrix?: SecurityMatrixRow[];
  findings?: BlueprintFinding[];
  facts?: CodeFact[];
  filesAnalyzed?: number;
  frameworkHints?: string[];
  violations?: RuleViolation[];
  cycles?: BlueprintCycle[];
}

export type BlueprintUpdateInput = Record<string, unknown>;

export function cellSymbol(state: ConceptState | "n/a" | undefined): string {
  if (!state || state === "unknown") return "?";
  if (state === "confirmed") return "✓";
  if (state === "missing" || state === "contradictory") return "✕";
  if (state === "partial" || state === "weak") return "~";
  return "?";
}
