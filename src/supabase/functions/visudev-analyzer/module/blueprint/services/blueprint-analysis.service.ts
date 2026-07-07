/** Orchestrates Blueprint scan: GitHub files → Facts → Concepts → Policies → Document. */

import type {
  AnalyzerModuleSettings,
  LoggerLike,
} from "../../interfaces/module.interface.ts";
import type {
  BlueprintAnalysisRequestDto,
  BlueprintAnalysisResultDto,
  BlueprintDocument,
  CodeFact,
  ProjectProfile,
} from "../../dto/blueprint/blueprint-document.dto.ts";
import { GitHubService } from "../../services/github.service.ts";
import { extractFactsFromFile } from "../facts/fact-extractors.ts";
import {
  redactErrorKind,
  redactFileRef,
  redactRepoRef,
} from "../internal/log-redaction.ts";
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

export class BlueprintAnalysisService {
  constructor(
    private readonly gitHubService: GitHubService,
    private readonly logger: LoggerLike,
    private readonly settings: AnalyzerModuleSettings,
  ) {}

  public async analyze(
    request: BlueprintAnalysisRequestDto,
  ): Promise<BlueprintAnalysisResultDto> {
    const { access_token, repo, branch, projectId } = request;
    this.logger.info("Starting blueprint analysis", {
      repoRef: redactRepoRef(repo),
      branch,
      projectId,
    });

    const commitSha = await this.gitHubService.getCurrentCommitSha(
      access_token,
      repo,
      branch,
    );
    const tree = await this.gitHubService.fetchRepoTree(
      access_token,
      repo,
      branch,
    );

    const codeFiles = tree.filter(
      (file) => file.type === "blob" && this.isSupportedFile(file.path),
    );
    const fileLimit = Math.max(this.settings.analysisFileLimit, 250);
    const prioritized = prioritizeBlueprintFiles(codeFiles).slice(0, fileLimit);

    const fileIndex = new Map<string, FileIndexEntry>();
    const allFacts: CodeFact[] = [];
    let analyzed = 0;

    for (const file of prioritized) {
      try {
        const content = await this.gitHubService.fetchFileContent(
          access_token,
          repo,
          file.path,
        );
        fileIndex.set(file.path, { path: file.path, content });
        const facts = extractFactsFromFile(file.path, content);
        allFacts.push(...facts);
        analyzed += 1;
      } catch (error) {
        this.logger.warn("Blueprint: failed to read file", {
          fileRef: redactFileRef(file.path),
          errorKind: redactErrorKind(error),
        });
      }
    }

    const routeScopes = buildRouteScopes(allFacts, fileIndex);
    const concepts = buildConceptsForRoutes(routeScopes, allFacts);
    const findings = evaluatePolicies(routeScopes, concepts, allFacts);
    const routes = buildRouteBlueprints(routeScopes, concepts);
    const securityMatrix = buildSecurityMatrix(routes, findings);

    const blueprint: BlueprintDocument = {
      version: 1,
      projectId,
      repo,
      branch,
      commitSha,
      analyzedAt: new Date().toISOString(),
      projectProfile: DEFAULT_PROFILE,
      routes,
      securityMatrix,
      findings,
      facts: allFacts.slice(0, 500),
      concepts,
      filesAnalyzed: analyzed,
      frameworkHints: detectFrameworkHints(allFacts),
    };

    const analysisId = crypto.randomUUID();
    this.logger.info("Blueprint analysis complete", {
      analysisId,
      routeCount: routes.length,
      findingCount: findings.length,
      filesAnalyzed: analyzed,
    });

    return { blueprint, analysisId };
  }

  private isSupportedFile(path: string): boolean {
    const ext = path.split(".").pop()?.toLowerCase();
    return Boolean(ext && ["ts", "tsx", "js", "jsx", "vue"].includes(ext));
  }
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
