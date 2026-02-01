import type { Hono } from "hono";
import type { LogsModuleConfig } from "./interfaces/module.interface.ts";
import { initModuleServices } from "./services/base.service.ts";
import { LogsRepository } from "./internal/repositories/logs.repository.ts";
import { LogsService } from "./services/logs.service.ts";
import { LogsController } from "./controllers/logs.controller.ts";
import { registerLogsRoutes } from "./routes/logs.routes.ts";

export function createLogsModule(config: LogsModuleConfig): {
  registerRoutes: (app: Hono) => void;
  controller: LogsController;
  service: LogsService;
  repository: LogsRepository;
} {
  initModuleServices(config);

  const repository = new LogsRepository();
  const service = new LogsService(repository);
  const controller = new LogsController(service);

  return {
    registerRoutes: (app: Hono): void => registerLogsRoutes(app, controller),
    controller,
    service,
    repository,
  };
}

export type { LogsModuleConfig } from "./interfaces/module.interface.ts";
export * from "./dto/index.ts";
