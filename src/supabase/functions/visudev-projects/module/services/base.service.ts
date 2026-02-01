import type {
  LoggerLike,
  ProjectsModuleConfig,
} from "../interfaces/module.interface.ts";

let moduleDeps: ProjectsModuleConfig | null = null;

export function initModuleServices(deps: ProjectsModuleConfig): void {
  moduleDeps = deps;
}

export function getModuleDeps(): ProjectsModuleConfig {
  if (!moduleDeps) {
    throw new Error(
      "[visudev-projects] Services not initialized. Call initModuleServices() first.",
    );
  }
  return moduleDeps;
}

export abstract class BaseService {
  protected readonly supabase = getModuleDeps().supabase;
  protected readonly logger: LoggerLike = getModuleDeps().logger;
  protected readonly config = getModuleDeps().config;
}
