import type { Hono } from "hono";
import type { AnalyzerController } from "../controllers/analyzer.controller.ts";
import { asyncHandler } from "../internal/middleware/async-handler.ts";

export function registerAnalyzerRoutes(app: Hono, controller: AnalyzerController): void {
  app.get("/", asyncHandler(controller.health.bind(controller)));
  app.post("/analyze", asyncHandler(controller.analyze.bind(controller)));
  app.get("/analysis/:id", asyncHandler(controller.getAnalysis.bind(controller)));
  app.post("/screenshots", asyncHandler(controller.captureScreenshots.bind(controller)));
}
