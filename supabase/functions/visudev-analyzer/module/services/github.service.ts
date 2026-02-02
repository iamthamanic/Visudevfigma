import { BaseService } from "./base.service.ts";
import type { GitHubFileNode } from "../dto/index.ts";
import { ExternalApiException } from "../internal/exceptions/index.ts";

interface GitHubCommitResponse {
  sha?: string;
}

interface GitHubTreeResponse {
  tree?: GitHubFileNode[];
}

export class GitHubService extends BaseService {
  public async getCurrentCommitSha(
    accessToken: string | undefined,
    repo: string,
    branch: string,
  ): Promise<string> {
    this.logger.info("Fetching commit SHA", { repo, branch });
    const response = await fetch(
      `${this.config.githubApiBaseUrl}/repos/${repo}/commits/${branch}`,
      {
        headers: this.buildHeaders(accessToken, "application/vnd.github.v3+json"),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error("GitHub commit fetch failed", {
        repo,
        branch,
        status: response.status,
        error: errorText,
      });
      throw new ExternalApiException(
        `Failed to fetch commit SHA: ${response.status} ${response.statusText}`,
        response.status,
      );
    }

    const data = (await response.json()) as GitHubCommitResponse;
    if (!data.sha) {
      throw new ExternalApiException("GitHub commit response missing sha");
    }

    this.logger.debug("Commit SHA resolved", {
      repo,
      branch,
      sha: data.sha.substring(0, 7),
    });
    return data.sha;
  }

  public async fetchRepoTree(
    accessToken: string | undefined,
    repo: string,
    branch: string,
  ): Promise<GitHubFileNode[]> {
    this.logger.info("Fetching repo tree", { repo, branch });
    const response = await fetch(
      `${this.config.githubApiBaseUrl}/repos/${repo}/git/trees/${branch}?recursive=1`,
      {
        headers: this.buildHeaders(accessToken, "application/vnd.github.v3+json"),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.error("GitHub tree fetch failed", {
        repo,
        branch,
        status: response.status,
        error: errorText,
      });
      throw new ExternalApiException(
        `GitHub API error: ${response.status} ${response.statusText}`,
        response.status,
      );
    }

    const data = (await response.json()) as GitHubTreeResponse;
    return data.tree ?? [];
  }

  public async fetchFileContent(
    accessToken: string | undefined,
    repo: string,
    path: string,
  ): Promise<string> {
    const response = await fetch(`${this.config.githubApiBaseUrl}/repos/${repo}/contents/${path}`, {
      headers: this.buildHeaders(accessToken, "application/vnd.github.v3.raw"),
    });

    if (!response.ok) {
      const errorText = await response.text();
      this.logger.warn("GitHub file fetch failed", {
        repo,
        path,
        status: response.status,
        error: errorText,
      });
      throw new ExternalApiException(`Failed to fetch file: ${path}`, response.status);
    }

    return await response.text();
  }

  private buildHeaders(accessToken: string | undefined, accept: string): Record<string, string> {
    const headers: Record<string, string> = { Accept: accept };
    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }
    return headers;
  }
}
