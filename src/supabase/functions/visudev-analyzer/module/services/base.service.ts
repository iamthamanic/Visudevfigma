import type {
  AnalyzerModuleConfig,
  LoggerLike,
} from "../interfaces/module.interface.ts";

/** Request-scoped deps: set once per request in index; no cross-request state in Deno. */
let moduleDeps: AnalyzerModuleConfig | null = null;

export function initModuleServices(deps: AnalyzerModuleConfig): void {
  moduleDeps = deps;
}

export function getModuleDeps(): AnalyzerModuleConfig {
  if (!moduleDeps) {
    throw new Error(
      "[visudev-analyzer] Services not initialized. Call initModuleServices() first.",
    );
  }
  return moduleDeps;
}

export abstract class BaseService {
  protected readonly supabase = getModuleDeps().supabase;
  protected readonly logger: LoggerLike = getModuleDeps().logger;
  protected readonly config = getModuleDeps().config;
}
