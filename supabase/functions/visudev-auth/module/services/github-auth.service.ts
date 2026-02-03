import type { Context } from "hono";
import type {
  GitHubAuthorizeResponseDto,
  GitHubAuthorizeReturnDto,
  GitHubRepoDto,
  GitHubSessionDto,
} from "../dto/index.ts";
import { BaseService } from "./base.service.ts";
import { getAuthUserIdFromContext } from "../internal/helpers/auth-helper.ts";
import {
  ConfigException,
  ExternalApiException,
  NotFoundException,
} from "../internal/exceptions/index.ts";
import { AuthRepository } from "../internal/repositories/auth.repository.ts";

export interface GitHubStatusDto {
  connected: boolean;
  account?: { login: string; id: number };
}

export class GitHubAuthService extends BaseService {
  constructor(private readonly repository: AuthRepository) {
    super();
  }

  public async createAuthorizeUrl(
    returnUrl?: string,
    authUserId?: string,
  ): Promise<GitHubAuthorizeResponseDto> {
    if (!this.config.githubClientId) {
      throw new ConfigException(
        "GitHub OAuth not configured. Please set GITHUB_CLIENT_ID.",
      );
    }

    const state = crypto.randomUUID();
    const scope = this.config.githubScope;

    if (returnUrl) {
      await this.repository.setValue(
        `github_oauth_return:${state}`,
        {
          return_url: returnUrl,
          created_at: new Date().toISOString(),
        } satisfies GitHubAuthorizeReturnDto,
      );
    }

    if (authUserId) {
      await this.repository.setValue(`github_oauth_user:${state}`, authUserId);
    }

    const authUrl =
      `${this.config.githubOAuthBaseUrl}/login/oauth/authorize?client_id=${this.config.githubClientId}&redirect_uri=${
        encodeURIComponent(this.config.githubRedirectUri)
      }&scope=${encodeURIComponent(scope)}&state=${state}`;

    return { authUrl, state };
  }

  public async handleCallback(
    code: string,
    state?: string,
  ): Promise<{ redirectUrl: string; state: string }> {
    if (!this.config.githubClientId || !this.config.githubClientSecret) {
      throw new ConfigException(
        "GitHub OAuth not configured. Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET.",
      );
    }

    const effectiveState = state ?? crypto.randomUUID();

    const tokenResponse = await fetch(
      `${this.config.githubOAuthBaseUrl}/login/oauth/access_token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          client_id: this.config.githubClientId,
          client_secret: this.config.githubClientSecret,
          code,
        }),
      },
    );

    if (!tokenResponse.ok) {
      throw new ExternalApiException(
        `GitHub OAuth token error: ${tokenResponse.statusText}`,
        tokenResponse.status,
      );
    }

    const tokenData = (await tokenResponse.json()) as {
      access_token?: string;
    };

    if (!tokenData.access_token) {
      throw new ExternalApiException("No access token received from GitHub");
    }

    const userResponse = await fetch(`${this.config.githubApiBaseUrl}/user`, {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!userResponse.ok) {
      throw new ExternalApiException(
        `GitHub user fetch error: ${userResponse.statusText}`,
        userResponse.status,
      );
    }

    const userData = await userResponse.json();

    const session: GitHubSessionDto = {
      access_token: tokenData.access_token,
      user: userData,
      created_at: new Date().toISOString(),
    };

    const authUserId = await this.repository.getValue<string>(
      `github_oauth_user:${effectiveState}`,
    );
    if (authUserId) {
      await this.repository.setValue(
        `github_user_token:${authUserId}`,
        session,
      );
    }

    await this.repository.setValue(`github_session:${effectiveState}`, session);

    const returnData = await this.repository.getValue<GitHubAuthorizeReturnDto>(
      `github_oauth_return:${effectiveState}`,
    );

    const defaultReturnUrl = this.config.githubDefaultReturnUrl;
    let redirectUrl = defaultReturnUrl;

    if (returnData?.return_url) {
      try {
        const target = new URL(returnData.return_url);
        target.searchParams.set("github", "connected");
        redirectUrl = target.toString();
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn("Failed to parse return URL", { message });
      }
    }

    await this.repository.deleteValue(`github_oauth_return:${effectiveState}`);
    await this.repository.deleteValue(`github_oauth_user:${effectiveState}`);

    return { redirectUrl, state: effectiveState };
  }

  public async getSession(state: string): Promise<GitHubSessionDto> {
    const session = await this.repository.getValue<GitHubSessionDto>(
      `github_session:${state}`,
    );

    if (!session) {
      throw new NotFoundException("Session");
    }

    return session;
  }

  public async getRepos(accessToken: string): Promise<GitHubRepoDto[]> {
    const response = await fetch(
      `${this.config.githubApiBaseUrl}/user/repos?per_page=100&sort=updated`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (!response.ok) {
      throw new ExternalApiException(
        `GitHub API error: ${response.statusText}`,
        response.status,
      );
    }

    return (await response.json()) as GitHubRepoDto[];
  }

  public async getStatus(authUserId: string): Promise<GitHubStatusDto> {
    const session = await this.repository.getValue<GitHubSessionDto>(
      `github_user_token:${authUserId}`,
    );
    if (!session?.access_token || !session.user) {
      return { connected: false };
    }
    const login = session.user.login;
    const id = session.user.id;
    return {
      connected: true,
      account: {
        login: typeof login === "string" ? login : String(login ?? ""),
        id: typeof id === "number" ? id : Number(id ?? 0),
      },
    };
  }

  public async getReposForUser(authUserId: string): Promise<GitHubRepoDto[]> {
    const session = await this.repository.getValue<GitHubSessionDto>(
      `github_user_token:${authUserId}`,
    );
    if (!session?.access_token) {
      return [];
    }
    return this.getRepos(session.access_token);
  }

  public async getAuthUserIdFromContext(c: Context): Promise<string> {
    return getAuthUserIdFromContext(c, this.supabase as unknown);
  }
}
