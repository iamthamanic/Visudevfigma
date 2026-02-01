import type {
  SupabaseProjectsResponseDto,
  SupabaseValidateResponseDto,
} from "../dto/index.ts";
import { BaseService } from "./base.service.ts";
import { ExternalApiException } from "../internal/exceptions/index.ts";

export class SupabaseAuthService extends BaseService {
  public async validateToken(
    managementToken: string,
  ): Promise<SupabaseValidateResponseDto> {
    const projects = await this.fetchProjects(managementToken);
    return { projects, valid: true };
  }

  public async getProjects(
    managementToken: string,
  ): Promise<SupabaseProjectsResponseDto> {
    const projects = await this.fetchProjects(managementToken);
    return { projects };
  }

  private async fetchProjects(managementToken: string): Promise<unknown[]> {
    const response = await fetch(
      `${this.config.supabaseApiBaseUrl}/v1/projects`,
      {
        headers: {
          Authorization: `Bearer ${managementToken}`,
        },
      },
    );

    if (!response.ok) {
      throw new ExternalApiException(
        `Supabase API error: ${response.statusText}`,
        response.status,
      );
    }

    return (await response.json()) as unknown[];
  }
}
