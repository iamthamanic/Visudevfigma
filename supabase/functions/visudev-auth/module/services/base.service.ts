import type {
  AuthModuleConfig,
  LoggerLike,
} from "../interfaces/module.interface.ts";

/** Request-scoped deps: set once per request in index; no cross-request state in Deno. */
let moduleDeps: AuthModuleConfig | null = null;

export function initModuleServices(deps: AuthModuleConfig): void {
  moduleDeps = deps;
}

export function getModuleDeps(): AuthModuleConfig {
  if (!moduleDeps) {
    throw new Error(
      "[visudev-auth] Services not initialized. Call initModuleServices() first.",
    );
  }
  return moduleDeps;
}

export abstract class BaseService {
  protected readonly supabase = getModuleDeps().supabase;
  protected readonly logger: LoggerLike = getModuleDeps().logger;
  protected readonly config = getModuleDeps().config;
}
