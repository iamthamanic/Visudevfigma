export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  private: boolean;
  default_branch: string;
}

export interface GitHubIntegration {
  token: string;
  username?: string;
  connectedAt: string;
}

export interface SupabaseIntegration {
  url: string;
  anonKey: string;
  serviceKey?: string;
  projectRef?: string;
  connectedAt: string;
}

export interface IntegrationsState {
  projectId?: string;
  updatedAt?: string;
  github?: GitHubIntegration;
  supabase?: SupabaseIntegration;
}

export type IntegrationsUpdateInput = Partial<Omit<IntegrationsState, "projectId" | "updatedAt">>;
