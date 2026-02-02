import type { Hono } from "hono";
import type { ScreenshotsModuleConfig } from "./interfaces/module.interface.ts";
import { initModuleServices } from "./services/base.service.ts";
import { StorageRepository } from "./internal/repositories/storage.repository.ts";
import { ScreenshotApiService } from "./services/screenshot-api.service.ts";
import { ScreenshotsService } from "./services/screenshots.service.ts";
import { ScreenshotsController } from "./controllers/screenshots.controller.ts";
import { registerScreenshotsRoutes } from "./routes/screenshots.routes.ts";

export function createScreenshotsModule(config: ScreenshotsModuleConfig): {
  registerRoutes: (app: Hono) => void;
  controller: ScreenshotsController;
  service: ScreenshotsService;
  repository: StorageRepository;
} {
  initModuleServices(config);

  const repository = new StorageRepository();
  const apiService = new ScreenshotApiService();
  const service = new ScreenshotsService(repository, apiService);
  const controller = new ScreenshotsController(
    service,
    config.logger,
    () => Boolean(config.config.apiKey),
  );

  return {
    registerRoutes: (app: Hono): void =>
      registerScreenshotsRoutes(app, controller),
    controller,
    service,
    repository,
  };
}

export type { ScreenshotsModuleConfig } from "./interfaces/module.interface.ts";
export * from "./dto/index.ts";
