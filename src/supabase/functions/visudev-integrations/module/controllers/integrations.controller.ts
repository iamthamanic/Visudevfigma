import type { Context } from "hono";
import { ZodError } from "zod";
import type {
  ConnectGitHubDto,
  ConnectSupabaseDto,
  IntegrationsResponseDto,
  UpdateIntegrationsDto,
} from "../dto/index.ts";
import { ValidationException } from "../internal/exceptions/index.ts";
import { IntegrationsService } from "../services/integrations.service.ts";
import {
  connectGitHubSchema,
  connectSupabaseSchema,
  projectIdSchema,
  setProjectGitHubRepoSchema,
  updateIntegrationsSchema,
} from "../validators/integrations.validator.ts";

interface SuccessResponse<T> {
  success: true;
  data: T;
}

export class IntegrationsController {
  constructor(private readonly service: IntegrationsService) {}

  public async getIntegrations(c: Context): Promise<Response> {
    const projectId = this.parseProjectId(c);
    const data = await this.service.getIntegrations(projectId);
    return this.ok<IntegrationsResponseDto>(c, data);
  }

  public async updateIntegrations(c: Context): Promise<Response> {
    const projectId = this.parseProjectId(c);
    const body = await this.parseBody<UpdateIntegrationsDto>(
      c,
      updateIntegrationsSchema,
    );
    const data = await this.service.updateIntegrations(projectId, body);
    return this.ok<IntegrationsResponseDto>(c, data);
  }

  public async connectGitHub(c: Context): Promise<Response> {
    const projectId = this.parseProjectId(c);
    const body = await this.parseBody<ConnectGitHubDto>(c, connectGitHubSchema);
    const data = await this.service.connectGitHub(projectId, body);
    return this.ok(c, data);
  }

  public async getGitHubRepos(c: Context): Promise<Response> {
    const projectId = this.parseProjectId(c);
    const userId = await this.service.getAuthUserIdFromContext(c);
    const repos = await this.service.getGitHubRepos(projectId, userId);
    return this.ok(c, repos);
  }

  public async setProjectGitHubRepo(c: Context): Promise<Response> {
    const projectId = this.parseProjectId(c);
    const userId = await this.service.getAuthUserIdFromContext(c);
    const body = await this.parseBody<{ repo: string; branch?: string }>(
      c,
      setProjectGitHubRepoSchema,
    );
    const data = await this.service.setProjectGitHubRepo(projectId, userId, {
      repo: body.repo,
      branch: body.branch,
    });
    return this.ok(c, data);
  }

  public async getGitHubBranches(c: Context): Promise<Response> {
    const projectId = this.parseProjectId(c);
    const owner = c.req.query("owner") ?? "";
    const repo = c.req.query("repo") ?? "";

    if (!owner || !repo) {
      throw new ValidationException("Missing owner or repo", [
        { field: "owner", message: "owner is required" },
        { field: "repo", message: "repo is required" },
      ]);
    }

    const branches = await this.service.getGitHubBranches(
      projectId,
      owner,
      repo,
    );
    return this.ok(c, branches);
  }

  public async getGitHubContent(c: Context): Promise<Response> {
    const projectId = this.parseProjectId(c);
    const owner = c.req.query("owner") ?? "";
    const repo = c.req.query("repo") ?? "";
    const path = c.req.query("path") ?? "";
    const ref = c.req.query("ref") ?? "main";

    if (!owner || !repo) {
      throw new ValidationException("Missing owner or repo", [
        { field: "owner", message: "owner is required" },
        { field: "repo", message: "repo is required" },
      ]);
    }

    const content = await this.service.getGitHubContent(
      projectId,
      owner,
      repo,
      path,
      ref,
    );
    return this.ok(c, content);
  }

  public async disconnectGitHub(c: Context): Promise<Response> {
    const projectId = this.parseProjectId(c);
    await this.service.disconnectGitHub(projectId);
    return c.json({ success: true }, 200);
  }

  public async connectSupabase(c: Context): Promise<Response> {
    const projectId = this.parseProjectId(c);
    const body = await this.parseBody<ConnectSupabaseDto>(
      c,
      connectSupabaseSchema,
    );
    const data = await this.service.connectSupabase(projectId, body);
    return this.ok(c, data);
  }

  public async getSupabaseInfo(c: Context): Promise<Response> {
    const projectId = this.parseProjectId(c);
    const info = await this.service.getSupabaseInfo(projectId);
    return this.ok(c, info);
  }

  public async disconnectSupabase(c: Context): Promise<Response> {
    const projectId = this.parseProjectId(c);
    await this.service.disconnectSupabase(projectId);
    return c.json({ success: true }, 200);
  }

  private parseProjectId(c: Context): string {
    try {
      return projectIdSchema.parse(c.req.param("projectId"));
    } catch (error) {
      throw this.asValidationError("Invalid project id", error);
    }
  }

  private async parseBody<T>(
    c: Context,
    schema: { parse: (data: unknown) => T },
  ): Promise<T> {
    let payload: unknown;
    try {
      payload = await c.req.json();
    } catch (error) {
      throw this.asValidationError("Invalid JSON body", error);
    }

    try {
      return schema.parse(payload);
    } catch (error) {
      throw this.asValidationError("Validation failed", error);
    }
  }

  private ok<T>(c: Context, data: T): Response {
    const payload: SuccessResponse<T> = { success: true, data };
    return c.json(payload, 200);
  }

  private asValidationError(
    message: string,
    error: unknown,
  ): ValidationException {
    if (error instanceof ZodError) {
      const details = error.issues.map((issue) => ({
        field: issue.path.join("."),
        message: issue.message,
      }));
      return new ValidationException(message, details);
    }
    return new ValidationException(message);
  }
}
