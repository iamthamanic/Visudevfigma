/**
 * Normalize partial/legacy Blueprint KV payloads for UI consumption.
 * Location: src/lib/visudev/normalize-blueprint.ts
 */

import type { BlueprintData } from "./blueprint-types";
import {
  sanitizeFacts,
  sanitizeFindings,
  sanitizeRoutes,
  sanitizeSecurityMatrix,
  sanitizeStringList,
} from "./normalize-blueprint-guards";
import { normalizeSoftwareGraph } from "./normalize-software-graph";

const EMPTY: BlueprintData = {
  version: 1,
  routes: [],
  securityMatrix: [],
  findings: [],
  facts: [],
  frameworkHints: [],
  filesAnalyzed: 0,
};

export function normalizeBlueprintData(
  raw: Record<string, unknown> | BlueprintData | null | undefined,
): BlueprintData {
  if (!raw || typeof raw !== "object") {
    return { ...EMPTY };
  }

  return {
    version: raw.version === 1 ? 1 : 1,
    projectId: typeof raw.projectId === "string" ? raw.projectId : undefined,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
    commitSha: typeof raw.commitSha === "string" ? raw.commitSha : undefined,
    analyzedAt: typeof raw.analyzedAt === "string" ? raw.analyzedAt : undefined,
    routes: sanitizeRoutes(raw.routes),
    securityMatrix: sanitizeSecurityMatrix(raw.securityMatrix),
    findings: sanitizeFindings(raw.findings),
    facts: sanitizeFacts(raw.facts),
    frameworkHints: sanitizeStringList(raw.frameworkHints),
    filesAnalyzed:
      typeof raw.filesAnalyzed === "number" && Number.isFinite(raw.filesAnalyzed)
        ? raw.filesAnalyzed
        : 0,
    violations: Array.isArray(raw.violations) ? raw.violations : undefined,
    cycles: Array.isArray(raw.cycles) ? raw.cycles : undefined,
    graph: normalizeSoftwareGraph(raw.graph),
  };
}
