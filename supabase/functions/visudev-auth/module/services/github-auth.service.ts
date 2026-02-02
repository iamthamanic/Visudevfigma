import type {
  GitHubAuthorizeResponseDto,
  GitHubAuthorizeReturnDto,
  GitHubRepoDto,
  GitHubSessionDto,
} from "../dto/index.ts";
import { BaseService } from "./base.service.ts";
import {
  ConfigException,
  ExternalApiException,
  NotFoundException,
} from "../internal/exceptions/index.ts";
import { AuthRepository } from "../internal/repositories/auth.repository.ts";

export class GitHubAuthService extends BaseService {
  constructor(private readonly repository: AuthRepository) {
    super();
  }

  public async createAuthorizeUrl(
    returnUrl?: string,
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

    await this.repository.setValue(`github_session:${effectiveState}`, session);

    const returnData = await this.repository.getValue<GitHubAuthorizeReturnDto>(
      `github_oauth_return:${effectiveState}`,
    );

    const defaultReturnUrl = this.appendStateToUrl(
      this.config.githubDefaultReturnUrl,
      effectiveState,
    );

    let redirectUrl = defaultReturnUrl;

    if (returnData?.return_url) {
      try {
        redirectUrl = this.appendStateToUrl(
          returnData.return_url,
          effectiveState,
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn("Failed to parse return URL", { message });
      }
    }

    await this.repository.deleteValue(`github_oauth_return:${effectiveState}`);

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

  private appendStateToUrl(url: string, state: string): string {
    const target = new URL(url);
    target.searchParams.set("github_auth_state", state);
    return target.toString();
  }
}
