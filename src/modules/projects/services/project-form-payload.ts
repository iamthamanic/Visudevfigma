/**
 * Maps project wizard form state to API payload fields.
 * Location: src/modules/projects/services/project-form-payload.ts
 */

import type {
  BlueprintProviderId,
  PreviewMode,
  Project,
  ProjectSourceMode,
} from "../../../lib/visudev/types";

export interface ProjectFormState {
  projectName: string;
  sourceMode: ProjectSourceMode;
  localPath: string;
  githubRepo: string;
  githubBranch: string;
  githubAccessToken: string;
  deployedUrl: string;
  previewMode: PreviewMode;
  databaseType: "supabase" | "local";
  blueprintProviderId?: BlueprintProviderId;
  supabaseProjectId: string;
  supabaseAnonKey: string;
  supabaseManagementToken: string;
}

export function buildProjectFormPayload(
  form: ProjectFormState,
): Omit<Project, "id" | "createdAt" | "screens" | "flows"> {
  const trimmedLocalPath = form.localPath.trim();
  const trimmedGithubRepo = form.githubRepo.trim();

  return {
    name:
      form.projectName.trim() ||
      trimmedGithubRepo.split("/").pop() ||
      trimmedLocalPath.split("/").filter(Boolean).pop() ||
      "Projekt",
    source_mode: form.sourceMode,
    local_path: form.sourceMode === "local" ? trimmedLocalPath : undefined,
    github_repo: form.sourceMode === "github" ? trimmedGithubRepo : undefined,
    github_branch: form.sourceMode === "github" ? form.githubBranch : undefined,
    github_access_token: form.sourceMode === "github" ? form.githubAccessToken : undefined,
    deployed_url: form.deployedUrl,
    preview_mode: form.previewMode,
    database_type: form.databaseType,
    blueprint_provider_id: form.blueprintProviderId,
    supabase_project_id: form.databaseType === "supabase" ? form.supabaseProjectId : undefined,
    supabase_anon_key: form.databaseType === "supabase" ? form.supabaseAnonKey : undefined,
    supabase_management_token:
      form.databaseType === "supabase" ? form.supabaseManagementToken : undefined,
    description:
      form.sourceMode === "local"
        ? `Lokal: ${trimmedLocalPath}`
        : `GitHub: ${trimmedGithubRepo}${form.deployedUrl ? ` | Live: ${form.deployedUrl}` : ""}`,
  };
}
