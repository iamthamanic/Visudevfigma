import type { IntegrationsModuleConfig, LoggerLike } from "../interfaces/module.interface.ts";

let moduleDeps: IntegrationsModuleConfig | null = null;

export function initModuleServices(deps: IntegrationsModuleConfig): void {
  moduleDeps = deps;
}

export function getModuleDeps(): IntegrationsModuleConfig {
  if (!moduleDeps) {
    throw new Error(
      "[visudev-integrations] Services not initialized. Call initModuleServices() first.",
    );
  }
  return moduleDeps;
}

export abstract class BaseService {
  protected readonly supabase = getModuleDeps().supabase;
  protected readonly logger: LoggerLike = getModuleDeps().logger;
  protected readonly config = getModuleDeps().config;
}
