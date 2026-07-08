/**
 * Preview orchestration service for Local Engine.
 * Location: local-engine/src/services/preview.service.ts
 */

import path from "node:path";
import { applyRuntimeScreenshots } from "../lib/runtime-screenshots.js";
import { readJsonFile, writeJsonFile } from "../storage/file-store.js";
import type { LocalPreviewRunnerProvider } from "../providers/local-preview-runner.provider.js";
import type { ProjectService } from "./project.service.js";
import type {
  CrawlPreviewInput,
  CrawlPreviewResult,
  LocalAppflowLatest,
  LocalRuntimeLatest,
  PreviewStartResult,
  PreviewStatusResult,
  PreviewStopResult,
  StartPreviewInput,
} from "../types/api.types.js";

export class PreviewService {
  constructor(
    private readonly storageDir: string,
    private readonly projectService: ProjectService,
    private readonly previewProvider: LocalPreviewRunnerProvider,
  ) {}

  private runtimeCachePath(projectId: string): string {
    return path.join(this.storageDir, "projects", projectId, "runtime-crawl.json");
  }

  private appflowCachePath(projectId: string): string {
    return path.join(this.storageDir, "projects", projectId, "appflow.json");
  }

  async startPreview(
    projectId: string,
    input: StartPreviewInput = { projectId },
  ): Promise<PreviewStartResult> {
    const project = await this.projectService.getProject(projectId);
    if (!project) {
      throw Object.assign(new Error("Project not found"), { statusCode: 404 });
    }
    const result = await this.previewProvider.startPreview({ ...input, projectId }, project);
    if (result.status !== "failed") {
      project.preview = {
        lastRunId: result.runId,
        lastPreviewUrl: result.previewUrl,
        status: result.status,
        updatedAt: new Date().toISOString(),
      };
      await this.projectService.saveProject(project);
    }
    return result;
  }

  async getPreviewStatus(projectId: string): Promise<PreviewStatusResult> {
    const project = await this.projectService.getProject(projectId);
    if (!project) {
      throw Object.assign(new Error("Project not found"), { statusCode: 404 });
    }
    const result = await this.previewProvider.getPreviewStatus(projectId);
    if (result.status === "ready" || result.status === "starting") {
      project.preview = {
        lastRunId: result.runId,
        lastPreviewUrl: result.previewUrl,
        status: result.status,
        updatedAt: new Date().toISOString(),
      };
      await this.projectService.saveProject(project);
    }
    return result;
  }

  async stopPreview(projectId: string): Promise<PreviewStopResult> {
    const project = await this.projectService.getProject(projectId);
    if (!project) {
      throw Object.assign(new Error("Project not found"), { statusCode: 404 });
    }
    const result = await this.previewProvider.stopPreview(projectId);
    project.preview = {
      ...project.preview,
      status: "stopped",
      updatedAt: new Date().toISOString(),
    };
    await this.projectService.saveProject(project);
    return result;
  }

  async crawlPreview(projectId: string, input: CrawlPreviewInput): Promise<CrawlPreviewResult> {
    const project = await this.projectService.getProject(projectId);
    if (!project) {
      throw Object.assign(new Error("Project not found"), { statusCode: 404 });
    }

    const status = await this.previewProvider.getPreviewStatus(projectId);
    if (status.status !== "ready") {
      throw Object.assign(
        new Error("Preview run is not ready for crawling. Start preview and wait until ready."),
        { statusCode: 409, code: "PREVIEW_NOT_READY" },
      );
    }

    const crawlResult = await this.previewProvider.crawlPreview(projectId, input);
    const screensWithShots = applyRuntimeScreenshots(
      input.screens as Array<{ id: string; screenshotUrl?: string; screenshotStatus?: string }>,
      crawlResult.runtime,
    );

    const runtimeLatest: LocalRuntimeLatest = {
      projectId,
      previewRunId: crawlResult.previewRunId,
      runtime: crawlResult.runtime,
      updatedAt: crawlResult.updatedAt,
    };
    await writeJsonFile(this.runtimeCachePath(projectId), runtimeLatest);

    const appflowLatest = await readJsonFile<LocalAppflowLatest | null>(
      this.appflowCachePath(projectId),
      null,
    );
    if (appflowLatest) {
      await writeJsonFile(this.appflowCachePath(projectId), {
        ...appflowLatest,
        screens: screensWithShots,
        runtime: crawlResult.runtime,
        updatedAt: crawlResult.updatedAt,
      } satisfies LocalAppflowLatest);
    }

    return {
      ...crawlResult,
      screens: screensWithShots,
    };
  }

  async getRuntimeLatest(projectId: string): Promise<LocalRuntimeLatest | null> {
    return readJsonFile<LocalRuntimeLatest | null>(this.runtimeCachePath(projectId), null);
  }
}
