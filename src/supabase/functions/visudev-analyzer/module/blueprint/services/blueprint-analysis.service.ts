/** Orchestrates Blueprint scan: GitHub files → shared pipeline → Document. */

import type {
  AnalyzerModuleSettings,
  LoggerLike,
} from "../../interfaces/module.interface.ts";
import type {
  BlueprintAnalysisRequestDto,
  BlueprintAnalysisResultDto,
} from "../../dto/blueprint/blueprint-document.dto.ts";
import { GitHubService } from "../../services/github.service.ts";
import {
  redactErrorKind,
  redactFileRef,
  redactRepoRef,
} from "../internal/log-redaction.ts";
import {
  applyFileLimitWithSeeds,
  prioritizeBlueprintFiles,
} from "../graph/call-graph.builder.ts";
import {
  analyzeFromFileEntries,
  isSupportedBlueprintFile,
} from "./blueprint-pipeline.service.ts";

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
      (file) => file.type === "blob" && isSupportedBlueprintFile(file.path),
    );
    const fileLimit = Math.max(this.settings.analysisFileLimit, 250);
    const prioritized = applyFileLimitWithSeeds(
      prioritizeBlueprintFiles(codeFiles),
      fileLimit,
    );

    const fileEntries: Array<{ path: string; content: string }> = [];

    for (const file of prioritized) {
      try {
        const content = await this.gitHubService.fetchFileContent(
          access_token,
          repo,
          file.path,
        );
        fileEntries.push({ path: file.path, content });
      } catch (error) {
        this.logger.warn("Blueprint: failed to read file", {
          fileRef: redactFileRef(file.path),
          errorKind: redactErrorKind(error),
        });
      }
    }

    const blueprint = analyzeFromFileEntries({
      projectId,
      repo,
      branch,
      commitSha,
      fileEntries,
      fileLimit,
    });

    const analysisId = crypto.randomUUID();
    this.logger.info("Blueprint analysis complete", {
      analysisId,
      routeCount: blueprint.routes.length,
      findingCount: blueprint.findings.length,
      filesAnalyzed: blueprint.filesAnalyzed,
    });

    return { blueprint, analysisId };
  }
}
