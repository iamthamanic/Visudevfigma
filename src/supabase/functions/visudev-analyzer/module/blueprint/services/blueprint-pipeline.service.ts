/** Shared Blueprint pipeline: file entries → Facts → Concepts → Policies → Document. */

import type {
  BlueprintDocument,
  CodeFact,
  ProjectProfile,
} from "../../dto/blueprint/blueprint-document.dto.ts";
import { extractFactsFromFile } from "../facts/fact-extractors.ts";
import {
  collectRelatedFiles,
  type FileIndexEntry,
  prioritizeBlueprintFiles,
} from "../graph/call-graph.builder.ts";
import type { RouteScope } from "../../dto/blueprint/route-scope.dto.ts";
import {
  buildRouteScopeId,
  validateRouteScopes,
} from "../graph/route-scope.validate.ts";
import {
  MAX_BLUEPRINT_FACTS,
  sanitizeFactsForExport,
} from "../internal/export-sanitizer.ts";
import { buildConceptsForRoutes } from "./concept-engine.service.ts";
import {
  buildRouteBlueprints,
  buildSecurityMatrix,
  evaluatePolicies,
} from "./policy-engine.service.ts";
import { assembleBlueprintGraph } from "./blueprint-graph-assembly.ts";
import { attachGraphFindings } from "../graph/graph-policy-findings.ts";
import { resolveRoutePath } from "../internal/route-path.util.ts";

const DEFAULT_PROFILE: ProjectProfile = {
  appType: "saas",
  expectedUsers: "medium",
  dataSensitivity: "pii",
  deployment: "vercel",
};

export interface FileSourceEntry {
  path: string;
  content: string;
}

export interface AnalyzeBlueprintFromFilesInput {
  projectId?: string;
  repo: string;
  branch: string;
  commitSha: string;
  fileEntries: FileSourceEntry[];
  fileLimit?: number;
  projectProfile?: ProjectProfile;
}

export function isSupportedBlueprintFile(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase();
  return Boolean(
    ext && ["ts", "tsx", "js", "jsx", "vue", "py", "prisma"].includes(ext),
  );
}

export function analyzeFromFileEntries(
  input: AnalyzeBlueprintFromFilesInput,
): BlueprintDocument {
  const fileLimit = Math.max(input.fileLimit ?? 250, 250);
  const prioritized = prioritizeBlueprintFiles(
    input.fileEntries.filter((entry) => isSupportedBlueprintFile(entry.path)),
  ).slice(0, fileLimit);

  const fileIndex = new Map<string, FileIndexEntry>();
  const allFacts: CodeFact[] = [];
  let analyzed = 0;

  for (const file of prioritized) {
    fileIndex.set(file.path, { path: file.path, content: file.content });
  }

  for (const file of prioritized) {
    const facts = extractFactsFromFile(file.path, file.content, fileIndex);
    allFacts.push(...facts);
    analyzed += 1;
  }

  const routeScopes = validateRouteScopes(
    buildRouteScopes(allFacts, fileIndex),
  );
  const exportFacts = sanitizeFactsForExport(
    allFacts.slice(0, MAX_BLUEPRINT_FACTS),
  );
  const concepts = buildConceptsForRoutes(routeScopes, allFacts);
  const findings = evaluatePolicies(routeScopes, concepts, allFacts);
  let graph = assembleBlueprintGraph(allFacts, routeScopes);
  const routes = buildRouteBlueprints(routeScopes, concepts, graph);
  const securityMatrix = buildSecurityMatrix(routes, findings, graph);
  graph = attachGraphFindings(graph, routes, routeScopes, allFacts, findings);

  return {
    version: 1,
    projectId: input.projectId,
    repo: input.repo,
    branch: input.branch,
    commitSha: input.commitSha,
    analyzedAt: new Date().toISOString(),
    projectProfile: input.projectProfile ?? DEFAULT_PROFILE,
    routes,
    securityMatrix,
    findings,
    facts: exportFacts,
    concepts,
    graph,
    filesAnalyzed: analyzed,
    frameworkHints: detectFrameworkHints(allFacts),
  };
}

function buildRouteScopes(
  facts: CodeFact[],
  fileIndex: Map<string, FileIndexEntry>,
): RouteScope[] {
  const routeFacts = facts.filter((fact) => fact.kind === "api-route");
  const scopes: RouteScope[] = [];
  const seen = new Set<string>();
  const usedBaseIds = new Set<string>();

  for (const fact of routeFacts) {
    const method = String(fact.metadata.method ?? "GET").toUpperCase();
    const path = joinMountPrefix(
      findExpressMountPrefix(fact.filePath, facts),
      resolveRoutePath(fact),
    );
    // Keep fact path in sync so route-facts-index keys match mounted scopes.
    fact.metadata = { ...fact.metadata, path, method };
    const id = buildRouteScopeId(
      method,
      path,
      fact.filePath,
      fact.line,
      usedBaseIds,
    );
    if (seen.has(id)) continue;
    seen.add(id);

    const relatedFiles = collectRelatedFiles(fact.filePath, fileIndex);
    scopes.push({
      id,
      method,
      path,
      filePath: fact.filePath,
      line: fact.line,
      relatedFiles,
    });
  }

  return scopes.sort((a, b) => a.path.localeCompare(b.path));
}

/** Same-dir app.use('/api/leaves', router) → prefix for module route files. */
function findExpressMountPrefix(
  routeFilePath: string,
  facts: CodeFact[],
): string | null {
  const routeDir = routeFilePath.replace(/\\/g, "/").replace(/\/[^/]+$/, "");
  for (const fact of facts) {
    if (fact.kind !== "route-mount") continue;
    const mountDir = fact.filePath.replace(/\\/g, "/").replace(/\/[^/]+$/, "");
    if (mountDir !== routeDir) continue;
    const mount = String(fact.metadata.path ?? "").trim();
    if (mount.startsWith("/")) return mount.replace(/\/$/, "") || "/";
  }
  return null;
}

function joinMountPrefix(mount: string | null, path: string): string {
  if (!mount || mount === "/") return path;
  if (!path || path === "/") return mount;
  return `${mount}${path.startsWith("/") ? path : `/${path}`}`;
}

function detectFrameworkHints(facts: CodeFact[]): string[] {
  const hints = new Set<string>();
  for (const fact of facts) {
    if (fact.metadata.framework) hints.add(String(fact.metadata.framework));
    if (fact.filePath.includes("supabase/functions")) {
      hints.add("supabase-edge");
    }
    if (
      (fact.kind === "db-read" || fact.kind === "db-write") &&
      fact.metadata.framework !== "prisma" &&
      fact.metadata.framework !== "django"
    ) {
      hints.add("supabase");
    }
  }
  return [...hints];
}
