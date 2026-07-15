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
import { enrichSoftwareGraphIfThin } from "../../../shared/demo-graph-thin.js";
import { normalizeSoftwareGraph } from "./normalize-software-graph";
import { deriveDiagnosticsFromGraph } from "./software-graph-projections";

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

  const projectId = typeof raw.projectId === "string" ? raw.projectId : "demo-project";
  const normalizedGraph = normalizeSoftwareGraph(raw.graph);
  const shouldEnrichDemo = import.meta.env.VITE_BLUEPRINT_DEMO_ENRICHMENT === "true";
  const graph =
    normalizedGraph && shouldEnrichDemo
      ? enrichSoftwareGraphIfThin(normalizedGraph, projectId)
      : normalizedGraph;
  const graphDiagnostics = graph ? deriveDiagnosticsFromGraph(graph) : null;

  const legacyRoutes = sanitizeRoutes(raw.routes);
  const legacySecurityMatrix = sanitizeSecurityMatrix(raw.securityMatrix);
  const legacyFindings = sanitizeFindings(raw.findings);
  const legacyFacts = sanitizeFacts(raw.facts);

  // Prefer a coherent diagnostics package: either richer legacy demo data or
  // graph-derived diagnostics — never mix arrays independently (scope alignment).
  const graphRoutes = graphDiagnostics?.routes ?? [];
  const graphMatrix = graphDiagnostics?.securityMatrix ?? [];
  const graphFindings = graphDiagnostics?.findings ?? [];
  const graphFacts = graphDiagnostics?.facts ?? [];
  const legacyDiagnosticsScore =
    legacyRoutes.length + legacySecurityMatrix.length + legacyFindings.length + legacyFacts.length;
  const graphDiagnosticsScore =
    graphRoutes.length + graphMatrix.length + graphFindings.length + graphFacts.length;
  const useLegacyDiagnostics = !graph || legacyDiagnosticsScore > graphDiagnosticsScore;

  return {
    version: raw.version === 1 ? 1 : 1,
    projectId: typeof raw.projectId === "string" ? raw.projectId : undefined,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : undefined,
    commitSha: typeof raw.commitSha === "string" ? raw.commitSha : undefined,
    analyzedAt: typeof raw.analyzedAt === "string" ? raw.analyzedAt : undefined,
    routes: useLegacyDiagnostics ? legacyRoutes : graphRoutes,
    securityMatrix: useLegacyDiagnostics ? legacySecurityMatrix : graphMatrix,
    findings: useLegacyDiagnostics ? legacyFindings : graphFindings,
    facts: useLegacyDiagnostics ? legacyFacts : graphFacts,
    frameworkHints: sanitizeStringList(raw.frameworkHints),
    filesAnalyzed:
      typeof raw.filesAnalyzed === "number" && Number.isFinite(raw.filesAnalyzed)
        ? raw.filesAnalyzed
        : 0,
    violations: Array.isArray(raw.violations) ? raw.violations : undefined,
    cycles: Array.isArray(raw.cycles) ? raw.cycles : undefined,
    graph,
  };
}
