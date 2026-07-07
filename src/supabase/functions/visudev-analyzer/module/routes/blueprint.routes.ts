import type { Hono } from "hono";
import type { BlueprintController } from "../blueprint/controllers/blueprint.controller.ts";
import { asyncHandler } from "../internal/middleware/async-handler.ts";

export function registerBlueprintRoutes(
  app: Hono,
  controller: BlueprintController,
): void {
  app.post(
    "/blueprint/analyze",
    asyncHandler(controller.analyze.bind(controller)),
  );
}
