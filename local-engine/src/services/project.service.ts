/**
 * Local project CRUD backed by ~/.visudev/projects.json.
 * Location: local-engine/src/services/project.service.ts
 */

import path from "node:path";
import { randomUUID } from "node:crypto";
import { resolveValidatedLocalPath } from "../lib/local-path-security.js";
import {
  ensureVisuDevDir,
  readJsonFile,
  removePath,
  writeJsonFile,
} from "../storage/file-store.js";
import type {
  CreateProjectInput,
  LocalVisuDevProject,
  ProjectsIndex,
  UpdateProjectInput,
} from "../types/api.types.js";
import type { PreviewProvider } from "../providers/preview-provider.js";

export class ProjectService {
  constructor(
    private readonly storageDir: string,
    private readonly previewProvider?: PreviewProvider,
  ) {}

  private indexPath(): string {
    return path.join(this.storageDir, "projects.json");
  }

  private projectDir(projectId: string): string {
    return path.join(this.storageDir, "projects", projectId);
  }

  private async readIndex(): Promise<ProjectsIndex> {
    return readJsonFile<ProjectsIndex>(this.indexPath(), { version: 1, projects: [] });
  }

  private async writeIndex(index: ProjectsIndex): Promise<void> {
    await writeJsonFile(this.indexPath(), index);
  }

  private validateLocalPath(localPath?: string | null): string | undefined {
    if (localPath == null || localPath === "") return undefined;
    const validated = resolveValidatedLocalPath(localPath);
    if (!validated.ok) {
      throw new Error(validated.error);
    }
    return validated.path;
  }

  async init(): Promise<void> {
    await ensureVisuDevDir(this.storageDir);
    const index = await this.readIndex();
    if (!index.version) {
      await this.writeIndex({ version: 1, projects: [] });
    }
  }

  async listProjects(): Promise<LocalVisuDevProject[]> {
    const index = await this.readIndex();
    return index.projects;
  }

  async getProject(projectId: string): Promise<LocalVisuDevProject | null> {
    const index = await this.readIndex();
    return index.projects.find((project) => project.id === projectId) ?? null;
  }

  async createProject(input: CreateProjectInput): Promise<LocalVisuDevProject> {
    const now = new Date().toISOString();
    const localPath = this.validateLocalPath(input.localPath);
    const project: LocalVisuDevProject = {
      id: randomUUID(),
      name: input.name.trim(),
      repositoryUrl: input.repositoryUrl?.trim() || undefined,
      localPath,
      createdAt: now,
      updatedAt: now,
      source: "local",
    };

    const index = await this.readIndex();
    index.projects.push(project);
    await this.writeIndex(index);
    await ensureVisuDevDir(path.join(this.storageDir, "projects", project.id));
    return project;
  }

  async updateProject(projectId: string, input: UpdateProjectInput): Promise<LocalVisuDevProject> {
    const index = await this.readIndex();
    const existing = index.projects.find((project) => project.id === projectId);
    if (!existing) {
      throw new Error("Project not found");
    }

    if (input.name !== undefined) {
      existing.name = input.name.trim();
    }
    if (input.repositoryUrl !== undefined) {
      existing.repositoryUrl = input.repositoryUrl?.trim() || undefined;
    }
    if (input.localPath !== undefined) {
      existing.localPath =
        input.localPath === null ? undefined : this.validateLocalPath(input.localPath);
    }
    existing.updatedAt = new Date().toISOString();
    await this.writeIndex(index);
    return existing;
  }

  async deleteProject(projectId: string): Promise<void> {
    if (this.previewProvider) {
      await this.previewProvider.stopPreview(projectId);
    }

    const index = await this.readIndex();
    const nextProjects = index.projects.filter((project) => project.id !== projectId);
    if (nextProjects.length === index.projects.length) {
      throw new Error("Project not found");
    }
    await this.writeIndex({ version: 1, projects: nextProjects });
    await removePath(this.projectDir(projectId));
    await removePath(path.join(this.storageDir, "previews", `${projectId}.json`));
  }

  async saveProject(project: LocalVisuDevProject): Promise<LocalVisuDevProject> {
    const index = await this.readIndex();
    const idx = index.projects.findIndex((entry) => entry.id === project.id);
    if (idx < 0) {
      throw new Error("Project not found");
    }
    project.updatedAt = new Date().toISOString();
    index.projects[idx] = project;
    await this.writeIndex(index);
    return project;
  }
}
