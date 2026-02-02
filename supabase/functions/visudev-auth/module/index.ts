import type { Hono } from "hono";
import type { AuthModuleConfig } from "./interfaces/module.interface.ts";
import { initModuleServices } from "./services/base.service.ts";
import { AuthRepository } from "./internal/repositories/auth.repository.ts";
import { GitHubAuthService } from "./services/github-auth.service.ts";
import { SupabaseAuthService } from "./services/supabase-auth.service.ts";
import { AuthController } from "./controllers/auth.controller.ts";
import { registerAuthRoutes } from "./routes/auth.routes.ts";

export function createAuthModule(config: AuthModuleConfig): {
  registerRoutes: (app: Hono) => void;
  controller: AuthController;
  githubService: GitHubAuthService;
  supabaseService: SupabaseAuthService;
  repository: AuthRepository;
} {
  initModuleServices(config);

  const repository = new AuthRepository();
  const githubService = new GitHubAuthService(repository);
  const supabaseService = new SupabaseAuthService();
  const controller = new AuthController(githubService, supabaseService, config.logger);

  return {
    registerRoutes: (app: Hono): void => registerAuthRoutes(app, controller),
    controller,
    githubService,
    supabaseService,
    repository,
  };
}

export type { AuthModuleConfig } from "./interfaces/module.interface.ts";
export * from "./dto/index.ts";
