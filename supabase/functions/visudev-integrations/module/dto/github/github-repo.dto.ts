export interface GitHubRepoDto {
  id: number;
  name: string;
  full_name: string;
  description?: string | null;
  private: boolean;
  default_branch?: string;
  [key: string]: unknown;
}
