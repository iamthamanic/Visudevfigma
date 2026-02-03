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

export interface GitHubStatusResult {
  connected: boolean;
  account?: { login: string; id: number };
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

interface GitHubStatusResponse {
  success: boolean;
  data?: GitHubStatusResult;
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

/** Fetch repos using Bearer (user-scoped token from KV). */
export async function fetchGitHubReposWithBearer(accessToken: string) {
  const result = await requestVisudevAuth<GitHubReposResponse>("/github/repos", { accessToken });

  if (!result.success) {
    throw new Error("Failed to load repositories");
  }

  return result.data ?? [];
}

/** Legacy: fetch repos with token in body (POST). */
export async function fetchGitHubRepos(accessToken: string) {
  const result = await requestVisudevAuth<GitHubReposResponse>("/github/repos", {
    method: "POST",
    body: JSON.stringify({ access_token: accessToken }),
  });

  if (!result.success) {
    throw new Error("Failed to load repositories");
  }

  return result.data ?? [];
}

/** Get authorize URL; requires Bearer (user session). On 401 throws with message e.g. "Please sign in first". */
export async function getGitHubAuthorizeUrl(returnUrl: string, accessToken: string) {
  if (!accessToken || accessToken.trim() === "") {
    throw new Error("Please sign in first");
  }
  const result = await requestVisudevAuth<GitHubAuthorizeResponse>(
    `/github/authorize?return_url=${encodeURIComponent(returnUrl)}`,
    { accessToken },
  );

  if (!result.success || !result.data?.authUrl) {
    throw new Error(result.error ?? "Failed to get authorization URL");
  }

  return result.data.authUrl;
}

/** Get GitHub connection status; requires Bearer (user session). */
export async function getGitHubStatus(accessToken: string): Promise<GitHubStatusResult> {
  if (!accessToken || accessToken.trim() === "") {
    return { connected: false };
  }
  const result = await requestVisudevAuth<GitHubStatusResponse>("/github/status", { accessToken });

  if (!result.success) {
    return { connected: false };
  }

  const data = result.data;
  if (!data) {
    return { connected: false };
  }

  return {
    connected: data.connected,
    account: data.account,
  };
}

/** Disconnect GitHub for the current user; requires Bearer (user session). */
export async function disconnectGitHub(accessToken: string): Promise<void> {
  if (!accessToken || accessToken.trim() === "") {
    throw new Error("Please sign in first");
  }
  const result = await requestVisudevAuth<{ success: boolean; data?: { disconnected: boolean }>>(
    "/github",
    { method: "DELETE", accessToken },
  );
  if (!result.success) {
    throw new Error("Failed to disconnect GitHub");
  }
}
