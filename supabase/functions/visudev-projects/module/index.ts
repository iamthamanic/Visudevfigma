import type { Hono } from "hono";
import type { ProjectsModuleConfig } from "./interfaces/module.interface.ts";
import { initModuleServices } from "./services/base.service.ts";
import { ProjectsRepository } from "./internal/repositories/projects.repository.ts";
import { ProjectsService } from "./services/projects.service.ts";
import { ProjectsController } from "./controllers/projects.controller.ts";
import { registerProjectsRoutes } from "./routes/projects.routes.ts";

export function createProjectsModule(config: ProjectsModuleConfig): {
  registerRoutes: (app: Hono) => void;
  controller: ProjectsController;
  service: ProjectsService;
  repository: ProjectsRepository;
} {
  initModuleServices(config);

  const repository = new ProjectsRepository();
  const service = new ProjectsService(repository);
  const controller = new ProjectsController(service);

  return {
    registerRoutes: (app: Hono): void =>
      registerProjectsRoutes(app, controller),
    controller,
    service,
    repository,
  };
}

export type { ProjectsModuleConfig } from "./interfaces/module.interface.ts";
export * from "./dto/index.ts";
