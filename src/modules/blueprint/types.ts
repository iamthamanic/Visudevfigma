/** dependency-cruiser-style rule violation (optional from analyzer). */
export interface RuleViolation {
  ruleId: string;
  severity: "error" | "warn" | "info";
  source: string;
  target?: string;
  message: string;
}

/** Optional: cycle from analyzer (e.g. dependency-cruiser). */
export interface BlueprintCycle {
  nodes: string[];
  message?: string;
}

export interface BlueprintData extends Record<string, unknown> {
  projectId?: string;
  updatedAt?: string;
  /** Optional: violations from analyzer (e.g. dependency-cruiser). */
  violations?: RuleViolation[];
  /** Optional: cyclic dependencies; Backend liefert cycles[], Frontend zeigt sie an. */
  cycles?: BlueprintCycle[];
}

export type BlueprintUpdateInput = Record<string, unknown>;
