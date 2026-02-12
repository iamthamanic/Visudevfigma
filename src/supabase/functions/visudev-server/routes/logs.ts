/**
 * Logs routes for visudev-server. Single responsibility: project logs CRUD.
 */
import { Hono } from "hono";
import { kv } from "../lib/kv.ts";
import { requireProjectOwner } from "../lib/auth.ts";
import { checkRateLimit, RATE_MAX_LOGS_PER_WINDOW } from "../lib/rate-limit.ts";
import { createLogBodySchema } from "../lib/schemas.ts";

export const logsRouter = new Hono();

logsRouter.get("/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
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
    console.log(`Error fetching logs: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

logsRouter.post("/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
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
    const raw = await c.req.json();
    const parsed = createLogBodySchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.message }, 400);
    }
    const body = parsed.data as Record<string, unknown>;
    const timestamp = new Date().toISOString();
    const logId = `${timestamp}:${crypto.randomUUID()}`;
    const log = {
      ...body,
      id: logId,
      projectId,
      timestamp,
    };
    await kv.set(`logs:${projectId}:${logId}`, log);
    return c.json({ success: true, data: log });
  } catch (error) {
    console.log(`Error creating log: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

logsRouter.delete("/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
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
    const keys = logs
      .map((log: { id?: string }) =>
        log?.id ? `logs:${projectId}:${log.id}` : null
      )
      .filter((k): k is string => k != null);
    if (keys.length > 0) await kv.mdel(keys);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting logs: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});
