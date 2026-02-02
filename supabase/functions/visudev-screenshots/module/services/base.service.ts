import type { LoggerLike, ScreenshotsModuleConfig } from "../interfaces/module.interface.ts";

let moduleDeps: ScreenshotsModuleConfig | null = null;

export function initModuleServices(deps: ScreenshotsModuleConfig): void {
  moduleDeps = deps;
}

export function getModuleDeps(): ScreenshotsModuleConfig {
  if (!moduleDeps) {
    throw new Error(
      "[visudev-screenshots] Services not initialized. Call initModuleServices() first.",
    );
  }
  return moduleDeps;
}

export abstract class BaseService {
  protected readonly supabase = getModuleDeps().supabase;
  protected readonly logger: LoggerLike = getModuleDeps().logger;
  protected readonly config = getModuleDeps().config;
}
