import { BaseService } from "../../services/base.service.ts";
import type {
  ConnectGitHubDto,
  ConnectSupabaseDto,
  IntegrationsResponseDto,
  SupabaseInfoDto,
  UpdateIntegrationsDto,
} from "../../dto/index.ts";

interface GitHubIntegrationRecord {
  token?: string;
  username?: string;
  connectedAt?: string;
}

interface SupabaseIntegrationRecord {
  url?: string;
  anonKey?: string;
  serviceKey?: string;
  projectRef?: string;
  connectedAt?: string;
}

interface IntegrationsRecord extends IntegrationsResponseDto {
  projectId?: string;
  updatedAt?: string;
  github?: GitHubIntegrationRecord;
  supabase?: SupabaseIntegrationRecord;
}
import { RepositoryException } from "../exceptions/index.ts";

export class IntegrationsRepository extends BaseService {
  public async getIntegrations(projectId: string): Promise<IntegrationsRecord> {
    const data = await this.getValue<IntegrationsRecord>(
      this.getKey(projectId),
    );
    return data ?? {};
  }

  public async updateIntegrations(
    projectId: string,
    payload: UpdateIntegrationsDto,
  ): Promise<IntegrationsRecord> {
    const updated: IntegrationsRecord = {
      ...payload,
      projectId,
      updatedAt: new Date().toISOString(),
    };
    await this.setValue(this.getKey(projectId), updated);
    return updated;
  }

  public async connectGitHub(
    projectId: string,
    payload: ConnectGitHubDto,
  ): Promise<{ connected: boolean; username?: string }> {
    const integrations = await this.getIntegrations(projectId);
    integrations.github = {
      token: payload.token,
      username: payload.username,
      connectedAt: new Date().toISOString(),
    };
    integrations.updatedAt = new Date().toISOString();
    await this.setValue(this.getKey(projectId), integrations);
    return { connected: true, username: payload.username };
  }

  public async disconnectGitHub(projectId: string): Promise<void> {
    const integrations = await this.getIntegrations(projectId);
    delete integrations.github;
    integrations.updatedAt = new Date().toISOString();
    await this.setValue(this.getKey(projectId), integrations);
  }

  public async connectSupabase(
    projectId: string,
    payload: ConnectSupabaseDto,
  ): Promise<SupabaseInfoDto> {
    const integrations = await this.getIntegrations(projectId);
    integrations.supabase = {
      url: payload.url,
      anonKey: payload.anonKey,
      serviceKey: payload.serviceKey,
      projectRef: payload.projectRef,
      connectedAt: new Date().toISOString(),
    };
    integrations.updatedAt = new Date().toISOString();
    await this.setValue(this.getKey(projectId), integrations);
    return {
      url: payload.url,
      projectRef: payload.projectRef,
      connected: true,
      connectedAt: integrations.supabase.connectedAt,
    };
  }

  public async disconnectSupabase(projectId: string): Promise<void> {
    const integrations = await this.getIntegrations(projectId);
    delete integrations.supabase;
    integrations.updatedAt = new Date().toISOString();
    await this.setValue(this.getKey(projectId), integrations);
  }

  public async getSupabaseInfo(
    projectId: string,
  ): Promise<SupabaseInfoDto | null> {
    const integrations = await this.getIntegrations(projectId);
    if (!integrations.supabase?.url) {
      return null;
    }
    return {
      url: integrations.supabase.url,
      projectRef: integrations.supabase.projectRef,
      connected: true,
      connectedAt: integrations.supabase.connectedAt,
    };
  }

  public async getGitHubToken(projectId: string): Promise<string | null> {
    const integrations = await this.getIntegrations(projectId);
    if (!integrations.github?.token) {
      return null;
    }
    return String(integrations.github.token);
  }

  private getKey(projectId: string): string {
    return `integrations:${projectId}`;
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
}
