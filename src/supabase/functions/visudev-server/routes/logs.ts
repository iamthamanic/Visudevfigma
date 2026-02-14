/**
 * Logs routes for visudev-server. Single responsibility: project logs CRUD.
 */
import { Hono } from "hono";
import type { AppDeps } from "../lib/deps-middleware.ts";
import { RATE_MAX_LOGS_PER_WINDOW } from "../lib/rate-limit.ts";
import { requireProjectOwner } from "../lib/auth.ts";
import { parseParam, projectIdParamSchema } from "../lib/params.ts";
import { parseJsonBody } from "../lib/parse.ts";
import { createLogBodySchema } from "../lib/schemas/log.ts";

export const logsRouter = new Hono<{ Variables: AppDeps }>();

logsRouter.get("/:projectId", async (c) => {
  try {
    const projectIdResult = parseParam(
      c.req.param("projectId"),
      projectIdParamSchema,
    );
    if (!projectIdResult.ok) {
      return c.json({ success: false, error: projectIdResult.error }, 400);
    }
    const projectId = projectIdResult.data;
    const kv = c.get("kv");
    const own = await requireProjectOwner(c, projectId);
    if (!own.ok) {
      return c.json(
        {
          success: false,
          error: own.status === 404 ? "Project not found" : "Forbidden",
        },
        own.status,
      );
    }
    const logs = await kv.getByPrefix(`logs:${projectId}:`);
    return c.json({ success: true, data: logs });
  } catch (error) {
    c.get("logError")("Error fetching logs.", error);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

logsRouter.post("/:projectId", async (c) => {
  try {
    const projectIdResult = parseParam(
      c.req.param("projectId"),
      projectIdParamSchema,
    );
    if (!projectIdResult.ok) {
      return c.json({ success: false, error: projectIdResult.error }, 400);
    }
    const projectId = projectIdResult.data;
    const kv = c.get("kv");
    const checkRateLimit = c.get("checkRateLimit");
    const own = await requireProjectOwner(c, projectId);
    if (!own.ok) {
      return c.json(
        {
          success: false,
          error: own.status === 404 ? "Project not found" : "Forbidden",
        },
        own.status,
      );
    }
    if (
      !(await checkRateLimit(
        `rate:logs:${projectId}`,
        RATE_MAX_LOGS_PER_WINDOW,
      ))
    ) {
      return c.json({ success: false, error: "Rate limit exceeded" }, 429);
    }
    const parseResult = await parseJsonBody(c, createLogBodySchema);
    if (!parseResult.ok) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    const body = parseResult.data as { message?: string; level?: string };
    const timestamp = new Date().toISOString();
    const logId = `${timestamp}:${crypto.randomUUID()}`;
    const log = {
      id: logId,
      projectId,
      timestamp,
      message: body.message,
      level: body.level,
    };
    await kv.set(`logs:${projectId}:${logId}`, log);
    return c.json({ success: true, data: log });
  } catch (error) {
    c.get("logError")("Error creating log.", error);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

logsRouter.delete("/:projectId", async (c) => {
  try {
    const projectIdResult = parseParam(
      c.req.param("projectId"),
      projectIdParamSchema,
    );
    if (!projectIdResult.ok) {
      return c.json({ success: false, error: projectIdResult.error }, 400);
    }
    const projectId = projectIdResult.data;
    const kv = c.get("kv");
    const own = await requireProjectOwner(c, projectId);
    if (!own.ok) {
      return c.json(
        {
          success: false,
          error: own.status === 404 ? "Project not found" : "Forbidden",
        },
        own.status,
      );
    }
    const checkRateLimit = c.get("checkRateLimit");
    const ownerId =
      typeof own.project.ownerId === "string" && own.project.ownerId
        ? own.project.ownerId
        : projectId;
    if (!(await checkRateLimit(`rate:logs:delete:${ownerId}`, 30))) {
      return c.json({ success: false, error: "Rate limit exceeded" }, 429);
    }
    const logs = await kv.getByPrefix(`logs:${projectId}:`);
    const keys = logs
      .map((log: { id?: string }) =>
        log?.id ? `logs:${projectId}:${log.id}` : null
      )
      .filter((k): k is string => k != null);
    if (keys.length > 0) await kv.mdel(keys);
    return c.json({ success: true });
  } catch (error) {
    c.get("logError")("Error deleting logs.", error);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});
