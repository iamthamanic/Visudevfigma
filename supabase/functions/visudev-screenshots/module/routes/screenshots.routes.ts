import type { Hono } from "hono";
import type { ScreenshotsController } from "../controllers/screenshots.controller.ts";
import { asyncHandler } from "../internal/middleware/async-handler.ts";

export function registerScreenshotsRoutes(
  app: Hono,
  controller: ScreenshotsController,
): void {
  app.get("/", asyncHandler(controller.health.bind(controller)));
  app.get("/health", asyncHandler(controller.health.bind(controller)));
  app.post("/capture", asyncHandler(controller.capture.bind(controller)));
}
