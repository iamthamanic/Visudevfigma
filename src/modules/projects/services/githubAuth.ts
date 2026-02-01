import { requestVisudevAuth } from "./visudevAuthClient";

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  default_branch: string;
}

export interface GitHubUser {
  login: string;
}

interface GitHubSessionResponse {
  success: boolean;
  data?: {
    access_token: string;
    user?: GitHubUser;
  };
}

interface GitHubReposResponse {
  success: boolean;
  data?: GitHubRepo[];
}

interface GitHubAuthorizeResponse {
  success: boolean;
  data?: {
    authUrl: string;
    state: string;
  };
  error?: string;
}

export async function exchangeGitHubSession(state: string) {
  const result = await requestVisudevAuth<GitHubSessionResponse>("/github/session", {
    method: "POST",
    body: JSON.stringify({ state }),
  });

  if (!result.success || !result.data?.access_token) {
    throw new Error("Failed to fetch session");
  }

  return {
    token: result.data.access_token,
    user: result.data.user,
  };
}

export async function fetchGitHubRepos(accessToken: string) {
  const result = await requestVisudevAuth<GitHubReposResponse>("/github/repos", {
    method: "POST",
    body: JSON.stringify({ access_token: accessToken }),
  });

  if (!result.success) {
    throw new Error("Failed to load repositories");
  }

  return result.data || [];
}

export async function getGitHubAuthorizeUrl(returnUrl: string) {
  const result = await requestVisudevAuth<GitHubAuthorizeResponse>(
    `/github/authorize?return_url=${encodeURIComponent(returnUrl)}`,
  );

  if (!result.success || !result.data?.authUrl) {
    throw new Error(result.error || "Failed to get authorization URL");
  }

  return result.data.authUrl;
}
