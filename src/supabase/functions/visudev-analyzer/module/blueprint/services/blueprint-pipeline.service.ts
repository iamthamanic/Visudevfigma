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
import {
  buildConceptsForRoutes,
  type RouteScope,
} from "./concept-engine.service.ts";
import {
  buildRouteBlueprints,
  buildSecurityMatrix,
  evaluatePolicies,
} from "./policy-engine.service.ts";

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
  return Boolean(ext && ["ts", "tsx", "js", "jsx", "vue"].includes(ext));
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
    const facts = extractFactsFromFile(file.path, file.content);
    allFacts.push(...facts);
    analyzed += 1;
  }

  const routeScopes = buildRouteScopes(allFacts, fileIndex);
  const concepts = buildConceptsForRoutes(routeScopes, allFacts);
  const findings = evaluatePolicies(routeScopes, concepts, allFacts);
  const routes = buildRouteBlueprints(routeScopes, concepts);
  const securityMatrix = buildSecurityMatrix(routes, findings);

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
    facts: allFacts.slice(0, 500),
    concepts,
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

  for (const fact of routeFacts) {
    const method = String(fact.metadata.method ?? "GET").toUpperCase();
    const path = String(fact.metadata.path ?? "/");
    const id = `${method} ${path}`;
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

function detectFrameworkHints(facts: CodeFact[]): string[] {
  const hints = new Set<string>();
  for (const fact of facts) {
    if (fact.metadata.framework) hints.add(String(fact.metadata.framework));
    if (fact.filePath.includes("supabase/functions")) {
      hints.add("supabase-edge");
    }
    if (fact.kind === "db-read" || fact.kind === "db-write") {
      hints.add("supabase");
    }
  }
  return [...hints];
}
