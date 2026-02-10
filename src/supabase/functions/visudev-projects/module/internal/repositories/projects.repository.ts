import { BaseService } from "../../services/base.service.ts";
import type {
  CreateProjectDto,
  ProjectResponseDto,
  UpdateProjectDto,
} from "../../dto/index.ts";
import { RepositoryException } from "../exceptions/index.ts";

export class ProjectsRepository extends BaseService {
  public async listProjects(): Promise<ProjectResponseDto[]> {
    const records = await this.listByPrefix<ProjectResponseDto>("project:");
    return records;
  }

  public async getProject(id: string): Promise<ProjectResponseDto | null> {
    return await this.getValue<ProjectResponseDto>(this.getKey(id));
  }

  public async createProject(
    id: string,
    payload: CreateProjectDto & { ownerId?: string },
  ): Promise<ProjectResponseDto> {
    const now = new Date().toISOString();
    const project: ProjectResponseDto = {
      ...payload,
      id,
      ownerId: payload.ownerId,
      createdAt: now,
      updatedAt: now,
    };
    await this.setValue(this.getKey(id), project);
    return project;
  }

  public async updateProject(
    id: string,
    payload: UpdateProjectDto,
    existing: ProjectResponseDto,
  ): Promise<ProjectResponseDto> {
    const updated: ProjectResponseDto = {
      ...existing,
      ...payload,
      id,
      updatedAt: new Date().toISOString(),
    };
    await this.setValue(this.getKey(id), updated);
    return updated;
  }

  public async deleteProject(id: string): Promise<void> {
    await this.deleteValue(this.getKey(id));
  }

  private getKey(id: string): string {
    return `project:${id}`;
  }

  private async getValue<T>(key: string): Promise<T | null> {
    const { data, error } = await this.supabase
      .from(this.config.kvTableName)
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) {
      this.logger.error("KV fetch failed", { key, error: error.message });
      throw new RepositoryException(error.message);
    }

    return (data?.value as T | null) ?? null;
  }

  private async setValue<T>(key: string, value: T): Promise<void> {
    const { error } = await this.supabase.from(this.config.kvTableName).upsert({
      key,
      value,
    });

    if (error) {
      this.logger.error("KV upsert failed", { key, error: error.message });
      throw new RepositoryException(error.message);
    }
  }

  private async deleteValue(key: string): Promise<void> {
    const { error } = await this.supabase.from(this.config.kvTableName).delete()
      .eq("key", key);

    if (error) {
      this.logger.error("KV delete failed", { key, error: error.message });
      throw new RepositoryException(error.message);
    }
  }

  private async listByPrefix<T>(prefix: string): Promise<T[]> {
    const { data, error } = await this.supabase
      .from(this.config.kvTableName)
      .select("key, value")
      .like("key", `${prefix}%`);

    if (error) {
      this.logger.error("KV list failed", { prefix, error: error.message });
      throw new RepositoryException(error.message);
    }

    return (data ?? []).map((row) => row.value as T);
  }
}
