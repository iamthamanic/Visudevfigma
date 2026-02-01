import { requestVisudevAuth } from "./visudevAuthClient";

export interface SupabaseProject {
  id: string;
  name: string;
  organization_id: string;
  region: string;
  created_at: string;
}

interface SupabaseProjectsResponse {
  success: boolean;
  data?: {
    projects: SupabaseProject[];
  };
}

export async function fetchSupabaseProjects(managementToken: string) {
  const result = await requestVisudevAuth<SupabaseProjectsResponse>("/supabase/projects", {
    method: "POST",
    body: JSON.stringify({ management_token: managementToken }),
  });

  if (!result.success) {
    throw new Error("Invalid management token");
  }

  return result.data?.projects || [];
}
