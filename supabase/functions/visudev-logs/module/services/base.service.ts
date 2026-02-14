import type {
  LoggerLike,
  LogsModuleConfig,
} from "../interfaces/module.interface.ts";

/** Request-scoped deps: set once per request in index; no cross-request state in Deno. */
let moduleDeps: LogsModuleConfig | null = null;

export function initModuleServices(deps: LogsModuleConfig): void {
  moduleDeps = deps;
}

export function getModuleDeps(): LogsModuleConfig {
  if (!moduleDeps) {
    throw new Error(
      "[visudev-logs] Services not initialized. Call initModuleServices() first.",
    );
  }
  return moduleDeps;
}

export abstract class BaseService {
  protected readonly supabase = getModuleDeps().supabase;
  protected readonly logger: LoggerLike = getModuleDeps().logger;
  protected readonly config = getModuleDeps().config;
}
