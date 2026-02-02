import type { DataModuleConfig, LoggerLike } from "../interfaces/module.interface.ts";

let moduleDeps: DataModuleConfig | null = null;

export function initModuleServices(deps: DataModuleConfig): void {
  moduleDeps = deps;
}

export function getModuleDeps(): DataModuleConfig {
  if (!moduleDeps) {
    throw new Error("[visudev-data] Services not initialized. Call initModuleServices() first.");
  }
  return moduleDeps;
}

export abstract class BaseService {
  protected readonly supabase = getModuleDeps().supabase;
  protected readonly logger: LoggerLike = getModuleDeps().logger;
  protected readonly config = getModuleDeps().config;
}
