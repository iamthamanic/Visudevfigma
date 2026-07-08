/**
 * Async analysis orchestration for Local Engine (blueprint + appflow + data).
 * Location: local-engine/src/services/analysis.service.ts
 */

import path from "node:path";
import { appendJsonLog, readJsonFile, writeJsonFile } from "../storage/file-store.js";
import { AutoGuideAnalysisProvider } from "../providers/autoguide-analysis.provider.js";
import { AutoGuideStubProvider } from "../providers/autoguide-stub.provider.js";
import type { AnalysisProvider } from "../providers/analysis-provider.js";
import { LegacyAppflowRunnerProvider } from "../providers/legacy-appflow-runner.provider.js";
import { LocalDataIntrospectionProvider } from "../providers/local-data-introspection.provider.js";
import { LegacyVisuDevAnalysisProvider } from "../providers/legacy-visudev-analysis.provider.js";
import type { EngineConfig } from "../config.js";
import type { ProjectService } from "./project.service.js";
import type {
  AnalysisRunStatus,
  AnalyzeProjectRequest,
  BlueprintAnalysisProviderId,
  EngineAnalysisRun,
  LocalAppflowAnalysisResult,
  LocalAppflowLatest,
  LocalBlueprintAnalysisResult,
  LocalBlueprintLatest,
  LocalDataAnalysisResult,
  LocalDataLatest,
  LocalEngineAnalysisResult,
  StartAnalysisResponse,
} from "../types/api.types.js";

type SupportedScanType = "blueprint" | "appflow" | "data";

function createRunId(): string {
  return `run_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function providerIdForScanType(
  scanType: SupportedScanType,
  blueprintProviderId: BlueprintAnalysisProviderId,
): EngineAnalysisRun["providerId"] {
  if (scanType === "appflow") return "legacy-appflow-runner";
  if (scanType === "data") return "local-data-introspection";
  return blueprintProviderId;
}

function resolveBlueprintProviderId(config: EngineConfig): BlueprintAnalysisProviderId {
  if (config.analysisProvider === "autoguide") return "autoguide";
  return "legacy-blueprint-runner";
}

export class AnalysisService {
  private readonly providers: Map<string, AnalysisProvider>;
  private readonly blueprintProviderId: BlueprintAnalysisProviderId;

  constructor(
    private readonly storageDir: string,
    private readonly projectService: ProjectService,
    runnerUrl: string,
    config: EngineConfig,
  ) {
    this.blueprintProviderId = resolveBlueprintProviderId(config);
    this.providers = new Map<string, AnalysisProvider>([
      ["legacy-blueprint-runner", new LegacyVisuDevAnalysisProvider(runnerUrl)],
      ["legacy-appflow-runner", new LegacyAppflowRunnerProvider(runnerUrl)],
      ["local-data-introspection", new LocalDataIntrospectionProvider()],
      [
        "autoguide",
        new AutoGuideAnalysisProvider({
          autoguideRoot: config.autoguideRoot,
          sourceSubdir: config.autoguideSourceDir,
        }),
      ],
    ]);
    if (config.autoguideStub) {
      this.providers.set("autoguide-stub", new AutoGuideStubProvider());
    }
  }

  private runDir(runId: string): string {
    return path.join(this.storageDir, "runs", runId);
  }

  private statusPath(runId: string): string {
    return path.join(this.runDir(runId), "status.json");
  }

  private resultPath(runId: string): string {
    return path.join(this.runDir(runId), "result.json");
  }

  private latestPointerPath(projectId: string, scanType: SupportedScanType): string {
    const fileName =
      scanType === "appflow"
        ? "latest-appflow-run.json"
        : scanType === "data"
          ? "latest-data-run.json"
          : "latest-blueprint-run.json";
    return path.join(this.storageDir, "projects", projectId, fileName);
  }

  private blueprintCachePath(projectId: string): string {
    return path.join(this.storageDir, "projects", projectId, "blueprint.json");
  }

  private appflowCachePath(projectId: string): string {
    return path.join(this.storageDir, "projects", projectId, "appflow.json");
  }

  private dataCachePath(projectId: string): string {
    return path.join(this.storageDir, "projects", projectId, "erd.json");
  }

  private resolveProvider(providerId: string): AnalysisProvider {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Unknown analysis provider: ${providerId}`);
    }
    return provider;
  }

  private assertSupportedScanType(scanType: AnalyzeProjectRequest["scanType"]): SupportedScanType {
    if (scanType === "blueprint" || scanType === "appflow" || scanType === "data") {
      return scanType;
    }
    const error = {
      code: "NOT_IMPLEMENTED_LOCAL_SCAN_TYPE",
      message: `Scan type "${scanType}" is not available in local mode yet.`,
    };
    throw Object.assign(new Error(error.message), { code: error.code, statusCode: 501 });
  }

  async startAnalysis(
    projectId: string,
    request: AnalyzeProjectRequest,
    baseUrl: string,
  ): Promise<StartAnalysisResponse> {
    const scanType = this.assertSupportedScanType(request.scanType);
    const project = await this.projectService.getProject(projectId);
    if (!project) {
      throw Object.assign(new Error("Project not found"), { statusCode: 404 });
    }

    const providerId = providerIdForScanType(scanType, this.blueprintProviderId);

    const runId = createRunId();
    const now = new Date().toISOString();
    const status: EngineAnalysisRun = {
      runId,
      projectId,
      scanType,
      providerId,
      status: "queued",
      createdAt: now,
      updatedAt: now,
    };

    await writeJsonFile(this.statusPath(runId), status);
    await appendJsonLog(path.join(this.runDir(runId), "log.jsonl"), {
      at: now,
      message: "Analysis queued",
      scanType,
    });

    void this.executeRun(runId, projectId, request, providerId, scanType).catch((error) => {
      console.error("[analysis] background run failed:", error);
    });

    return {
      projectId,
      runId,
      scanType,
      status: "queued",
      statusUrl: `${baseUrl}/api/projects/${projectId}/analyze/${runId}`,
      resultUrl: `${baseUrl}/api/projects/${projectId}/analyze/${runId}/result`,
    };
  }

  private async executeRun(
    runId: string,
    projectId: string,
    request: AnalyzeProjectRequest,
    providerId: EngineAnalysisRun["providerId"],
    scanType: SupportedScanType,
  ): Promise<void> {
    const project = await this.projectService.getProject(projectId);
    if (!project) return;

    const runningAt = new Date().toISOString();
    await writeJsonFile(this.statusPath(runId), {
      runId,
      projectId,
      scanType,
      providerId,
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

    if (scanType === "blueprint") {
      await this.persistBlueprintRun(runId, projectId, providerId, runningAt, finishedAt, result);
      return;
    }

    if (scanType === "appflow") {
      await this.persistAppflowRun(runId, projectId, providerId, runningAt, finishedAt, result);
      return;
    }

    await this.persistDataRun(runId, projectId, providerId, runningAt, finishedAt, result);
  }

  private async persistBlueprintRun(
    runId: string,
    projectId: string,
    providerId: EngineAnalysisRun["providerId"],
    runningAt: string,
    finishedAt: string,
    result: LocalEngineAnalysisResult,
  ): Promise<void> {
    if (result.kind !== "blueprint") {
      await writeJsonFile(this.statusPath(runId), {
        runId,
        projectId,
        scanType: "blueprint",
        providerId,
        status: "failed",
        createdAt: runningAt,
        updatedAt: finishedAt,
        error:
          result.kind === "failed"
            ? result.error
            : result.kind === "unsupported"
              ? {
                  code: "ANALYSIS_UNSUPPORTED",
                  message: result.message,
                }
              : {
                  code: "ANALYSIS_UNSUPPORTED",
                  message: "Unexpected analysis result.",
                },
      } satisfies EngineAnalysisRun);
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
      providerId,
      runnerAnalysisId,
      status: "success",
      createdAt: runningAt,
      updatedAt: finishedAt,
    } satisfies EngineAnalysisRun);

    await writeJsonFile(this.latestPointerPath(projectId, "blueprint"), {
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
        ...current.analysis,
        latestBlueprintRunId: runId,
        latestBlueprintStatus: "success",
        updatedAt: finishedAt,
      };
      await this.projectService.saveProject(current);
    }
  }

  private async persistAppflowRun(
    runId: string,
    projectId: string,
    providerId: EngineAnalysisRun["providerId"],
    runningAt: string,
    finishedAt: string,
    result: LocalEngineAnalysisResult,
  ): Promise<void> {
    if (result.kind !== "appflow") {
      await writeJsonFile(this.statusPath(runId), {
        runId,
        projectId,
        scanType: "appflow",
        providerId,
        status: "failed",
        createdAt: runningAt,
        updatedAt: finishedAt,
        error:
          result.kind === "failed"
            ? result.error
            : result.kind === "unsupported"
              ? {
                  code: "ANALYSIS_UNSUPPORTED",
                  message: result.message,
                }
              : {
                  code: "ANALYSIS_UNSUPPORTED",
                  message: "Unexpected analysis result.",
                },
      } satisfies EngineAnalysisRun);
      return;
    }

    const appflowResult: LocalAppflowAnalysisResult = {
      ...result,
      runId,
      createdAt: finishedAt,
    };

    const runnerAnalysisId =
      result.raw && typeof result.raw === "object" && "runnerAnalysisId" in result.raw
        ? String((result.raw as { runnerAnalysisId?: string }).runnerAnalysisId ?? "")
        : undefined;

    await writeJsonFile(this.resultPath(runId), appflowResult);
    await writeJsonFile(this.statusPath(runId), {
      runId,
      projectId,
      scanType: "appflow",
      providerId,
      runnerAnalysisId,
      status: "success",
      createdAt: runningAt,
      updatedAt: finishedAt,
    } satisfies EngineAnalysisRun);

    await writeJsonFile(this.latestPointerPath(projectId, "appflow"), {
      projectId,
      runId,
      updatedAt: finishedAt,
    });
    await writeJsonFile(this.appflowCachePath(projectId), {
      projectId,
      runId,
      screens: appflowResult.screens,
      flows: appflowResult.flows,
      graph: appflowResult.graph,
      quality: appflowResult.quality,
      framework: appflowResult.framework,
      commitSha: appflowResult.commitSha,
      updatedAt: finishedAt,
    } satisfies LocalAppflowLatest);

    const current = await this.projectService.getProject(projectId);
    if (current) {
      current.analysis = {
        ...current.analysis,
        latestAppflowRunId: runId,
        latestAppflowStatus: "success",
        updatedAt: finishedAt,
      };
      await this.projectService.saveProject(current);
    }
  }

  private async persistDataRun(
    runId: string,
    projectId: string,
    providerId: EngineAnalysisRun["providerId"],
    runningAt: string,
    finishedAt: string,
    result: LocalEngineAnalysisResult,
  ): Promise<void> {
    if (result.kind !== "data") {
      await writeJsonFile(this.statusPath(runId), {
        runId,
        projectId,
        scanType: "data",
        providerId,
        status: "failed",
        createdAt: runningAt,
        updatedAt: finishedAt,
        error:
          result.kind === "failed"
            ? result.error
            : result.kind === "unsupported"
              ? {
                  code: "ANALYSIS_UNSUPPORTED",
                  message: result.message,
                }
              : {
                  code: "ANALYSIS_UNSUPPORTED",
                  message: "Unexpected analysis result.",
                },
      } satisfies EngineAnalysisRun);
      return;
    }

    const dataResult: LocalDataAnalysisResult = {
      ...result,
      runId,
      createdAt: finishedAt,
    };

    await writeJsonFile(this.resultPath(runId), dataResult);
    await writeJsonFile(this.statusPath(runId), {
      runId,
      projectId,
      scanType: "data",
      providerId,
      status: "success",
      createdAt: runningAt,
      updatedAt: finishedAt,
    } satisfies EngineAnalysisRun);

    await writeJsonFile(this.latestPointerPath(projectId, "data"), {
      projectId,
      runId,
      updatedAt: finishedAt,
    });
    await writeJsonFile(this.dataCachePath(projectId), {
      projectId,
      runId,
      nodes: dataResult.erd.nodes,
      tables: dataResult.erd.tables,
      message: dataResult.erd.message,
      dialect: dataResult.erd.dialect,
      source: dataResult.erd.source,
      updatedAt: finishedAt,
    } satisfies LocalDataLatest);

    const current = await this.projectService.getProject(projectId);
    if (current) {
      current.analysis = {
        ...current.analysis,
        latestDataRunId: runId,
        latestDataStatus: "success",
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

    if (status.scanType === "appflow") {
      const result = await readJsonFile<LocalAppflowAnalysisResult | null>(
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

    if (status.scanType === "data") {
      const result = await readJsonFile<LocalDataAnalysisResult | null>(
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

  async getAppflowLatest(projectId: string): Promise<LocalAppflowLatest | null> {
    return readJsonFile<LocalAppflowLatest | null>(this.appflowCachePath(projectId), null);
  }

  async getDataLatest(projectId: string): Promise<LocalDataLatest | null> {
    return readJsonFile<LocalDataLatest | null>(this.dataCachePath(projectId), null);
  }
}
