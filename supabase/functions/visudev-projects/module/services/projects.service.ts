import type {
  CreateProjectDto,
  ProjectResponseDto,
  UpdateProjectDto,
} from "../dto/index.ts";
import { NotFoundException } from "../internal/exceptions/index.ts";
import { ProjectsRepository } from "../internal/repositories/projects.repository.ts";
import { BaseService } from "./base.service.ts";

export class ProjectsService extends BaseService {
  constructor(private readonly repository: ProjectsRepository) {
    super();
  }

  /** IDOR: when no JWT, return empty list; otherwise filter to owned or unowned projects. */
  public async listProjects(
    userId?: string | null,
  ): Promise<ProjectResponseDto[]> {
    this.logger.info("Listing projects", { hasUserId: userId != null });
    if (userId == null) return [];
    const all = await this.repository.listProjects();
    return all.filter(
      (p) =>
        (p as { ownerId?: string }).ownerId == null ||
        (p as { ownerId?: string }).ownerId === userId,
    );
  }

  public getProject(id: string): Promise<ProjectResponseDto | null> {
    this.logger.info("Fetching project", { id });
    return this.repository.getProject(id);
  }

  public createProject(
    id: string,
    payload: CreateProjectDto,
  ): Promise<ProjectResponseDto> {
    this.logger.info("Creating project", { id });
    return this.repository.createProject(id, payload);
  }

  public async updateProject(
    id: string,
    payload: UpdateProjectDto,
  ): Promise<ProjectResponseDto> {
    const existing = await this.repository.getProject(id);
    if (!existing) {
      throw new NotFoundException("Project");
    }
    this.logger.info("Updating project", { id });
    return this.repository.updateProject(id, payload, existing);
  }

  public async deleteProject(id: string): Promise<void> {
    this.logger.info("Deleting project", { id });
    await this.repository.deleteProject(id);
  }
}
