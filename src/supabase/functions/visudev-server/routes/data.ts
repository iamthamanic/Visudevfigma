/**
 * Data routes for visudev-server. Single responsibility: schema and migrations.
 */
import { Hono } from "hono";
import type { AppDeps } from "../lib/deps-middleware.ts";
import { requireProjectOwner } from "../lib/auth.ts";
import { parseParam, projectIdParamSchema } from "../lib/params.ts";
import { parseJsonBody } from "../lib/parse.ts";
import {
  updateDataSchemaBodySchema,
  updateMigrationsBodySchema,
} from "../lib/schemas/data.ts";

export const dataRouter = new Hono<{ Variables: AppDeps }>();

dataRouter.get("/:projectId/schema", async (c) => {
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
    const schema = await kv.get(`data:${projectId}:schema`);
    return c.json({ success: true, data: schema || {} });
  } catch (error) {
    c.get("logError")("Error fetching schema.", error);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

dataRouter.put("/:projectId/schema", async (c) => {
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
    const ownerId =
      typeof own.project.ownerId === "string" && own.project.ownerId
        ? own.project.ownerId
        : projectId;
    if (!(await checkRateLimit(`rate:data:schema:${ownerId}`, 30))) {
      return c.json({ success: false, error: "Rate limit exceeded" }, 429);
    }
    const parseResult = await parseJsonBody(c, updateDataSchemaBodySchema);
    if (!parseResult.ok) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    const body = parseResult.data as { tables?: unknown[] };
    const schema = {
      tables: body.tables,
      projectId,
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`data:${projectId}:schema`, schema);
    return c.json({ success: true, data: schema });
  } catch (error) {
    c.get("logError")("Error updating schema.", error);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

dataRouter.get("/:projectId/migrations", async (c) => {
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
    const migrations = await kv.get(`data:${projectId}:migrations`);
    return c.json({ success: true, data: migrations || [] });
  } catch (error) {
    c.get("logError")("Error fetching migrations.", error);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

dataRouter.put("/:projectId/migrations", async (c) => {
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
    const ownerId =
      typeof own.project.ownerId === "string" && own.project.ownerId
        ? own.project.ownerId
        : projectId;
    if (!(await checkRateLimit(`rate:data:migrations:${ownerId}`, 30))) {
      return c.json({ success: false, error: "Rate limit exceeded" }, 429);
    }
    const parseResult = await parseJsonBody(c, updateMigrationsBodySchema);
    if (!parseResult.ok) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    await kv.set(`data:${projectId}:migrations`, parseResult.data);
    return c.json({ success: true, data: parseResult.data });
  } catch (error) {
    c.get("logError")("Error updating migrations.", error);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});
