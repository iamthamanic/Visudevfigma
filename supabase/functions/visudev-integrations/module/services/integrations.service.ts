import type {
  ConnectGitHubDto,
  ConnectSupabaseDto,
  GitHubBranchDto,
  GitHubContentDto,
  GitHubRepoDto,
  IntegrationsResponseDto,
  SupabaseInfoDto,
  UpdateIntegrationsDto,
} from "../dto/index.ts";
import { ExternalApiException, NotFoundException } from "../internal/exceptions/index.ts";
import { IntegrationsRepository } from "../internal/repositories/integrations.repository.ts";
import { BaseService } from "./base.service.ts";

export class IntegrationsService extends BaseService {
  constructor(private readonly repository: IntegrationsRepository) {
    super();
  }

  public getIntegrations(projectId: string): Promise<IntegrationsResponseDto> {
    this.logger.info("Fetching integrations", { projectId });
    return this.repository.getIntegrations(projectId);
  }

  public updateIntegrations(
    projectId: string,
    payload: UpdateIntegrationsDto,
  ): Promise<IntegrationsResponseDto> {
    this.logger.info("Updating integrations", { projectId });
    return this.repository.updateIntegrations(projectId, payload);
  }

  public connectGitHub(
    projectId: string,
    payload: ConnectGitHubDto,
  ): Promise<{ connected: boolean; username?: string }> {
    this.logger.info("Connecting GitHub", { projectId });
    return this.repository.connectGitHub(projectId, payload);
  }

  public async disconnectGitHub(projectId: string): Promise<void> {
    this.logger.info("Disconnecting GitHub", { projectId });
    await this.repository.disconnectGitHub(projectId);
  }

  public async getGitHubRepos(projectId: string): Promise<GitHubRepoDto[]> {
    const token = await this.repository.getGitHubToken(projectId);
    if (!token) {
      throw new NotFoundException("GitHub integration");
    }
    return this.fetchGitHub<GitHubRepoDto[]>(`/user/repos?per_page=100`, token);
  }

  public async getGitHubBranches(
    projectId: string,
    owner: string,
    repo: string,
  ): Promise<GitHubBranchDto[]> {
    const token = await this.repository.getGitHubToken(projectId);
    if (!token) {
      throw new NotFoundException("GitHub integration");
    }
    return this.fetchGitHub<GitHubBranchDto[]>(`/repos/${owner}/${repo}/branches`, token);
  }

  public async getGitHubContent(
    projectId: string,
    owner: string,
    repo: string,
    path: string,
    ref: string,
  ): Promise<GitHubContentDto> {
    const token = await this.repository.getGitHubToken(projectId);
    if (!token) {
      throw new NotFoundException("GitHub integration");
    }
    const trimmedPath = path?.replace(/^\/+/, "") ?? "";
    const encodedPath = trimmedPath ? `/${trimmedPath}` : "";
    const query = ref ? `?ref=${encodeURIComponent(ref)}` : "";
    return this.fetchGitHub<GitHubContentDto>(
      `/repos/${owner}/${repo}/contents${encodedPath}${query}`,
      token,
    );
  }

  public connectSupabase(projectId: string, payload: ConnectSupabaseDto): Promise<SupabaseInfoDto> {
    this.logger.info("Connecting Supabase", { projectId });
    return this.repository.connectSupabase(projectId, payload);
  }

  public async getSupabaseInfo(projectId: string): Promise<SupabaseInfoDto> {
    const info = await this.repository.getSupabaseInfo(projectId);
    if (!info) {
      throw new NotFoundException("Supabase integration");
    }
    return info;
  }

  public async disconnectSupabase(projectId: string): Promise<void> {
    this.logger.info("Disconnecting Supabase", { projectId });
    await this.repository.disconnectSupabase(projectId);
  }

  private async fetchGitHub<T>(path: string, token: string): Promise<T> {
    const url = `${this.config.githubApiBaseUrl}${path}`;
    const response = await fetch(url, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      const message = `GitHub API error: ${response.status} ${response.statusText}`;
      throw new ExternalApiException(message, response.status);
    }

    return (await response.json()) as T;
  }
}
