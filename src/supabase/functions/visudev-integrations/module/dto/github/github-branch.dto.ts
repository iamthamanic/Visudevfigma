export interface GitHubBranchDto {
  name: string;
  commit?: { sha?: string };
  protected?: boolean;
  [key: string]: unknown;
}
