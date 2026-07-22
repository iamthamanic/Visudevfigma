/**
 * useProjectMutations — create/update/delete projects; refresh list after success.
 * Kept apart from list-state so load/race logic and mutation workflows stay separate.
 */
import type { ProjectCreateInput, ProjectUpdateInput } from "../types";
import { toSafeClientError } from "../services/projects.errors";
import type { ProjectsApiPort } from "../services/projects.port";
import { createProject, deleteProject, updateProject } from "../services/projects.service";

type RefreshFn = () => Promise<void>;

export function useProjectMutations(refresh: RefreshFn, port: ProjectsApiPort) {
  const createProjectAction = async (createInput: ProjectCreateInput) => {
    try {
      const mutationResult = await createProject(createInput, port);
      if (mutationResult.success) await refresh();
      return mutationResult.success
        ? mutationResult
        : {
            success: false,
            error: toSafeClientError(mutationResult.error, "Failed to create project"),
          };
    } catch {
      return { success: false, error: "Failed to create project" };
    }
  };

  const updateProjectAction = async (projectId: string, updateInput: ProjectUpdateInput) => {
    try {
      const mutationResult = await updateProject(projectId, updateInput, port);
      if (mutationResult.success) await refresh();
      return mutationResult.success
        ? mutationResult
        : {
            success: false,
            error: toSafeClientError(mutationResult.error, "Failed to update project"),
          };
    } catch {
      return { success: false, error: "Failed to update project" };
    }
  };

  const deleteProjectAction = async (projectId: string) => {
    try {
      const mutationResult = await deleteProject(projectId, port);
      if (mutationResult.success) await refresh();
      return mutationResult.success
        ? mutationResult
        : {
            success: false,
            error: toSafeClientError(mutationResult.error, "Failed to delete project"),
          };
    } catch {
      return { success: false, error: "Failed to delete project" };
    }
  };

  return {
    createProject: createProjectAction,
    updateProject: updateProjectAction,
    deleteProject: deleteProjectAction,
  };
}
