import type { Hono } from "hono";
import type { LogsController } from "../controllers/logs.controller.ts";
import { asyncHandler } from "../internal/middleware/async-handler.ts";

export function registerLogsRoutes(
  app: Hono,
  controller: LogsController,
): void {
  app.get("/:projectId", asyncHandler(controller.listLogs.bind(controller)));
  app.get(
    "/:projectId/:logId",
    asyncHandler(controller.getLog.bind(controller)),
  );
  app.post("/:projectId", asyncHandler(controller.createLog.bind(controller)));
  app.delete(
    "/:projectId",
    asyncHandler(controller.deleteAllLogs.bind(controller)),
  );
  app.delete(
    "/:projectId/:logId",
    asyncHandler(controller.deleteLog.bind(controller)),
  );
}
