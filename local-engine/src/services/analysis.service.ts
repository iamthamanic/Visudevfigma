/**
 * Async blueprint analysis orchestration for Local Engine.
 * Location: local-engine/src/services/analysis.service.ts
 */

import path from "node:path";
import { appendJsonLog, readJsonFile, writeJsonFile } from "../storage/file-store.js";
import { AutoGuideAnalysisProvider } from "../providers/autoguide-analysis.provider.js";
import type { AnalysisProvider } from "../providers/analysis-provider.js";
import { LegacyVisuDevAnalysisProvider } from "../providers/legacy-visudev-analysis.provider.js";
import type { ProjectService } from "./project.service.js";
import type {
  AnalysisRunStatus,
  AnalyzeProjectRequest,
  EngineAnalysisRun,
  LocalBlueprintAnalysisResult,
  LocalBlueprintLatest,
  LocalEngineAnalysisResult,
  StartAnalysisResponse,
} from "../types/api.types.js";

function createRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export class AnalysisService {
  private readonly providers: Map<string, AnalysisProvider>;

  constructor(
    private readonly storageDir: string,
    private readonly projectService: ProjectService,
    runnerUrl: string,
    defaultProviderId: string,
  ) {
    this.providers = new Map<string, AnalysisProvider>([
      ["legacy-blueprint-runner", new LegacyVisuDevAnalysisProvider(runnerUrl)],
      ["autoguide-stub", new AutoGuideAnalysisProvider()],
    ]);
    this.defaultProviderId = defaultProviderId;
  }

  private readonly defaultProviderId: string;

  private runDir(runId: string): string {
    return path.join(this.storageDir, "runs", runId);
  }

  private statusPath(runId: string): string {
    return path.join(this.runDir(runId), "status.json");
  }

  private resultPath(runId: string): string {
    return path.join(this.runDir(runId), "result.json");
  }

  private latestPointerPath(projectId: string): string {
    return path.join(this.storageDir, "projects", projectId, "latest-blueprint-run.json");
  }

  private blueprintCachePath(projectId: string): string {
    return path.join(this.storageDir, "projects", projectId, "blueprint.json");
  }

  private resolveProvider(providerId: string): AnalysisProvider {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Unknown analysis provider: ${providerId}`);
    }
    return provider;
  }

  async startAnalysis(
    projectId: string,
    request: AnalyzeProjectRequest,
    baseUrl: string,
  ): Promise<StartAnalysisResponse> {
    if (request.scanType !== "blueprint") {
      const error = {
        code: "NOT_IMPLEMENTED_LOCAL_SCAN_TYPE",
        message: `Scan type "${request.scanType}" is not available in local mode yet.`,
      };
      throw Object.assign(new Error(error.message), { code: error.code, statusCode: 501 });
    }

    const project = await this.projectService.getProject(projectId);
    if (!project) {
      throw Object.assign(new Error("Project not found"), { statusCode: 404 });
    }

    const providerId = this.defaultProviderId;
    if (providerId === "autoguide-stub") {
      throw Object.assign(new Error("AutoGuide provider is not implemented"), { statusCode: 501 });
    }

    const runId = createRunId();
    const now = new Date().toISOString();
    const status: EngineAnalysisRun = {
      runId,
      projectId,
      scanType: "blueprint",
      providerId: "legacy-blueprint-runner",
      status: "queued",
      createdAt: now,
      updatedAt: now,
    };

    await writeJsonFile(this.statusPath(runId), status);
    await appendJsonLog(path.join(this.runDir(runId), "log.jsonl"), {
      at: now,
      message: "Analysis queued",
      scanType: request.scanType,
    });

    void this.executeRun(runId, projectId, request, providerId).catch((error) => {
      console.error("[analysis] background run failed:", error);
    });

    return {
      projectId,
      runId,
      scanType: "blueprint",
      status: "queued",
      statusUrl: `${baseUrl}/api/projects/${projectId}/analyze/${runId}`,
      resultUrl: `${baseUrl}/api/projects/${projectId}/analyze/${runId}/result`,
    };
  }

  private async executeRun(
    runId: string,
    projectId: string,
    request: AnalyzeProjectRequest,
    providerId: string,
  ): Promise<void> {
    const project = await this.projectService.getProject(projectId);
    if (!project) return;

    const runningAt = new Date().toISOString();
    await writeJsonFile(this.statusPath(runId), {
      runId,
      projectId,
      scanType: "blueprint",
      providerId: "legacy-blueprint-runner",
      status: "running",
      createdAt: runningAt,
      updatedAt: runningAt,
    } satisfies EngineAnalysisRun);

    const provider = this.resolveProvider(providerId);
    const result = await provider.analyzeProject({
      ...request,
      projectId,
      project,
      localPath: request.localPath ?? project.localPath,
    });

    const finishedAt = new Date().toISOString();

    if (result.kind !== "blueprint") {
      const failed = {
        runId,
        projectId,
        scanType: "blueprint" as const,
        providerId: "legacy-blueprint-runner" as const,
        status: "failed" as const,
        createdAt: runningAt,
        updatedAt: finishedAt,
        error:
          result.kind === "failed"
            ? result.error
            : {
                code: "ANALYSIS_UNSUPPORTED",
                message: result.message,
              },
      };
      await writeJsonFile(this.statusPath(runId), failed);
      return;
    }

    const blueprintResult: LocalBlueprintAnalysisResult = {
      ...result,
      runId,
      createdAt: finishedAt,
    };

    const runnerAnalysisId =
      result.raw && typeof result.raw === "object" && "runnerAnalysisId" in result.raw
        ? String((result.raw as { runnerAnalysisId?: string }).runnerAnalysisId ?? "")
        : undefined;

    await writeJsonFile(this.resultPath(runId), blueprintResult);
    await writeJsonFile(this.statusPath(runId), {
      runId,
      projectId,
      scanType: "blueprint",
      providerId: "legacy-blueprint-runner",
      runnerAnalysisId,
      status: "success",
      createdAt: runningAt,
      updatedAt: finishedAt,
    } satisfies EngineAnalysisRun);

    await writeJsonFile(this.latestPointerPath(projectId), {
      projectId,
      runId,
      updatedAt: finishedAt,
    });
    await writeJsonFile(this.blueprintCachePath(projectId), {
      projectId,
      runId,
      blueprint: blueprintResult.blueprint,
      updatedAt: finishedAt,
    } satisfies LocalBlueprintLatest);

    const current = await this.projectService.getProject(projectId);
    if (current) {
      current.analysis = {
        latestBlueprintRunId: runId,
        latestBlueprintStatus: "success",
        updatedAt: finishedAt,
      };
      await this.projectService.saveProject(current);
    }
  }

  async getStatus(projectId: string, runId: string): Promise<AnalysisRunStatus> {
    const status = await readJsonFile<EngineAnalysisRun | null>(this.statusPath(runId), null);
    if (!status || status.projectId !== projectId) {
      throw Object.assign(new Error("Analysis run not found"), { statusCode: 404 });
    }
    return {
      projectId: status.projectId,
      runId: status.runId,
      scanType: status.scanType,
      status: status.status,
      startedAt: status.createdAt,
      finishedAt:
        status.status === "success" || status.status === "failed" ? status.updatedAt : undefined,
      error: status.error,
    };
  }

  async getResult(projectId: string, runId: string): Promise<LocalEngineAnalysisResult> {
    const status = await this.getStatus(projectId, runId);
    if (status.status === "queued" || status.status === "running") {
      return {
        kind: "failed",
        projectId,
        runId,
        status: "failed",
        error: {
          code: "ANALYSIS_NOT_READY",
          message: "Analysis is still running.",
        },
      };
    }
    if (status.status === "failed") {
      return {
        kind: "failed",
        projectId,
        runId,
        status: "failed",
        error: status.error ?? {
          code: "ANALYSIS_FAILED",
          message: "Analysis failed.",
        },
      };
    }

    const result = await readJsonFile<LocalBlueprintAnalysisResult | null>(
      this.resultPath(runId),
      null,
    );
    if (!result) {
      return {
        kind: "failed",
        projectId,
        runId,
        status: "failed",
        error: {
          code: "ANALYSIS_RESULT_MISSING",
          message: "Analysis result file is missing.",
        },
      };
    }
    return result;
  }

  async getBlueprintLatest(projectId: string): Promise<LocalBlueprintLatest | null> {
    return readJsonFile<LocalBlueprintLatest | null>(this.blueprintCachePath(projectId), null);
  }
}
