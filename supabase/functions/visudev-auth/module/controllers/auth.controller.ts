import type { Context } from "hono";
import { ZodError } from "zod";
import type {
  GitHubAuthorizeResponseDto,
  GitHubRepoDto,
  GitHubSessionDto,
  SupabaseProjectsResponseDto,
  SupabaseValidateResponseDto,
} from "../dto/index.ts";
import { ValidationException } from "../internal/exceptions/index.ts";
import { GitHubAuthService } from "../services/github-auth.service.ts";
import { SupabaseAuthService } from "../services/supabase-auth.service.ts";
import type { SuccessResponse } from "../types/index.ts";
import {
  githubAuthorizeQuerySchema,
  githubReposSchema,
  githubSessionSchema,
  supabaseTokenSchema,
} from "../validators/auth.validator.ts";
import type { LoggerLike } from "../interfaces/module.interface.ts";

export class AuthController {
  constructor(
    private readonly githubService: GitHubAuthService,
    private readonly supabaseService: SupabaseAuthService,
    private readonly logger: LoggerLike,
  ) {}

  /** Public health check – no auth required. Use in browser to verify the function is reachable. */
  public health(c: Context): Response {
    return this.ok(c, { service: "visudev-auth", ok: true });
  }

  public async githubAuthorize(c: Context): Promise<Response> {
    const authUserId = await this.githubService.getAuthUserIdFromContext(c);
    const returnUrl = c.req.query("return_url") ?? undefined;
    const parsed = githubAuthorizeQuerySchema.parse({ return_url: returnUrl });
    const data = await this.githubService.createAuthorizeUrl(
      parsed.return_url,
      authUserId,
    );
    return this.ok<GitHubAuthorizeResponseDto>(c, data);
  }

  public async githubCallback(c: Context): Promise<Response> {
    const code = c.req.query("code");
    const state = c.req.query("state") ?? undefined;

    if (!code) {
      return this.htmlError("No code received from GitHub");
    }

    try {
      const result = await this.githubService.handleCallback(code, state);
      return new Response(null, {
        status: 302,
        headers: {
          Location: result.redirectUrl,
        },
      });
    } catch (error) {
      const message = this.toMessage(error);
      this.logger.error("GitHub OAuth error", { message });
      return this.htmlError("Error connecting to GitHub", message);
    }
  }

  /** Data Leakage: do not send raw access_token to client; redact in response. */
  public async githubSession(c: Context): Promise<Response> {
    const body = await this.parseBody<{ state: string }>(
      c,
      githubSessionSchema,
    );
    const data = await this.githubService.getSession(body.state);
    const redacted: GitHubSessionDto = { ...data, access_token: "***" };
    return this.ok<GitHubSessionDto>(c, redacted);
  }

  public async githubStatus(c: Context): Promise<Response> {
    const authUserId = await this.githubService.getAuthUserIdFromContext(c);
    const data = await this.githubService.getStatus(authUserId);
    return this.ok(c, data);
  }

  public async githubReposGet(c: Context): Promise<Response> {
    const authUserId = await this.githubService.getAuthUserIdFromContext(c);
    const data = await this.githubService.getReposForUser(authUserId);
    return this.ok<GitHubRepoDto[]>(c, data);
  }

  public async githubRepos(c: Context): Promise<Response> {
    const body = await this.parseBody<{ access_token: string }>(
      c,
      githubReposSchema,
    );
    const data = await this.githubService.getRepos(body.access_token);
    return this.ok<GitHubRepoDto[]>(c, data);
  }

  public async supabaseValidate(c: Context): Promise<Response> {
    const body = await this.parseBody<{ management_token: string }>(
      c,
      supabaseTokenSchema,
    );
    const data = await this.supabaseService.validateToken(
      body.management_token,
    );
    return this.ok<SupabaseValidateResponseDto>(c, data);
  }

  public async supabaseProjects(c: Context): Promise<Response> {
    const body = await this.parseBody<{ management_token: string }>(
      c,
      supabaseTokenSchema,
    );
    const data = await this.supabaseService.getProjects(body.management_token);
    return this.ok<SupabaseProjectsResponseDto>(c, data);
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

  private htmlError(title: string, detail?: string): Response {
    const detailHtml = detail ? `<p>${detail}</p>` : "";
    return new Response(
      `<!doctype html><html><body><h1>Error: ${title}</h1>${detailHtml}<script>window.close()</script></body></html>`,
      {
        status: 400,
        headers: { "Content-Type": "text/html" },
      },
    );
  }

  private toMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}
