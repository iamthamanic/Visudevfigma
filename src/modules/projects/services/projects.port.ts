/**
 * Port contract so projects domain code depends on behavior, not the legacy facade.
 */
import type { Project } from "../../../lib/visudev/types";
import type { ProjectCreateInput, ProjectUpdateInput } from "../types";

export type ProjectsServiceResult<T> = {
  success: boolean;
  data?: T;
  error?: string;
};

export type ProjectsApiPort = {
  getAll: () => Promise<ProjectsServiceResult<Project[]>>;
  get: (id: string) => Promise<ProjectsServiceResult<Project>>;
  create: (data: ProjectCreateInput) => Promise<ProjectsServiceResult<Project>>;
  update: (id: string, data: ProjectUpdateInput) => Promise<ProjectsServiceResult<unknown>>;
  delete: (id: string) => Promise<ProjectsServiceResult<unknown>>;
};
