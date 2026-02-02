export interface GitHubUserDto {
  login?: string;
  [key: string]: unknown;
}

export interface GitHubAuthorizeResponseDto {
  authUrl: string;
  state: string;
}

export interface GitHubSessionDto {
  access_token: string;
  user?: GitHubUserDto;
  created_at: string;
}

export interface GitHubSessionResponseDto {
  access_token: string;
  user?: GitHubUserDto;
}

export interface GitHubRepoDto {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  default_branch: string;
  [key: string]: unknown;
}

export interface SupabaseValidateResponseDto {
  projects: unknown[];
  valid: true;
}

export interface SupabaseProjectsResponseDto {
  projects: unknown[];
}

export interface GitHubAuthorizeReturnDto {
  return_url: string;
  created_at: string;
}

export interface GitHubSessionRequestDto {
  state: string;
}

export interface GitHubReposRequestDto {
  access_token: string;
}

export interface SupabaseTokenRequestDto {
  management_token: string;
}
