/**
 * Preview orchestration service for Local Engine.
 * Location: local-engine/src/services/preview.service.ts
 */

import type { LocalPreviewRunnerProvider } from "../providers/local-preview-runner.provider.js";
import type { ProjectService } from "./project.service.js";
import type {
  PreviewStartResult,
  PreviewStatusResult,
  PreviewStopResult,
  StartPreviewInput,
} from "../types/api.types.js";

export class PreviewService {
  constructor(
    private readonly projectService: ProjectService,
    private readonly previewProvider: LocalPreviewRunnerProvider,
  ) {}

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
}
