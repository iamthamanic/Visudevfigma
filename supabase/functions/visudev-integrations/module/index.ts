import type { Hono } from "hono";
import type { IntegrationsModuleConfig } from "./interfaces/module.interface.ts";
import { initModuleServices } from "./services/base.service.ts";
import { IntegrationsRepository } from "./internal/repositories/integrations.repository.ts";
import { IntegrationsService } from "./services/integrations.service.ts";
import { IntegrationsController } from "./controllers/integrations.controller.ts";
import { registerIntegrationsRoutes } from "./routes/integrations.routes.ts";

export function createIntegrationsModule(config: IntegrationsModuleConfig): {
  registerRoutes: (app: Hono) => void;
  controller: IntegrationsController;
  service: IntegrationsService;
  repository: IntegrationsRepository;
} {
  initModuleServices(config);

  const repository = new IntegrationsRepository();
  const service = new IntegrationsService(repository);
  const controller = new IntegrationsController(service);

  return {
    registerRoutes: (app: Hono): void => registerIntegrationsRoutes(app, controller),
    controller,
    service,
    repository,
  };
}

export type { IntegrationsModuleConfig } from "./interfaces/module.interface.ts";
export * from "./dto/index.ts";
