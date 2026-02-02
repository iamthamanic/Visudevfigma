import type { Hono } from "hono";
import type { AnalyzerModuleConfig } from "./interfaces/module.interface.ts";
import { initModuleServices } from "./services/base.service.ts";
import { AnalysisRepository } from "./internal/repositories/analysis.repository.ts";
import { GitHubService } from "./services/github.service.ts";
import { FlowService } from "./services/flow.service.ts";
import { ScreenService } from "./services/screen.service.ts";
import { AnalysisService } from "./services/analysis.service.ts";
import { ScreenshotService } from "./services/screenshot.service.ts";
import { AnalyzerController } from "./controllers/analyzer.controller.ts";
import { registerAnalyzerRoutes } from "./routes/analyzer.routes.ts";

export function createAnalyzerModule(config: AnalyzerModuleConfig): {
  registerRoutes: (app: Hono) => void;
  controller: AnalyzerController;
  analysisService: AnalysisService;
  screenshotService: ScreenshotService;
  repository: AnalysisRepository;
} {
  initModuleServices(config);

  const repository = new AnalysisRepository();
  const gitHubService = new GitHubService();
  const flowService = new FlowService();
  const screenService = new ScreenService();
  const analysisService = new AnalysisService(
    repository,
    gitHubService,
    flowService,
    screenService,
  );
  const screenshotService = new ScreenshotService();
  const controller = new AnalyzerController(analysisService, screenshotService);

  return {
    registerRoutes: (app: Hono): void => registerAnalyzerRoutes(app, controller),
    controller,
    analysisService,
    screenshotService,
    repository,
  };
}

export type { AnalyzerModuleConfig } from "./interfaces/module.interface.ts";
export * from "./dto/index.ts";
