/**
 * Data routes for visudev-server. Single responsibility: schema and migrations.
 */
import { Hono } from "hono";
import { kv } from "../lib/kv.ts";
import { checkRateLimit } from "../lib/rate-limit.ts";
import { requireProjectOwner } from "../lib/auth.ts";
import { parseJsonBody } from "../lib/parse.ts";
import {
  updateDataSchemaBodySchema,
  updateMigrationsBodySchema,
} from "../lib/schemas/data.ts";

export const dataRouter = new Hono();

dataRouter.get("/:projectId/schema", async (c) => {
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
    const schema = await kv.get(`data:${projectId}:schema`);
    return c.json({ success: true, data: schema || {} });
  } catch (error) {
    console.log(`Error fetching schema: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

dataRouter.put("/:projectId/schema", async (c) => {
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
    const body = parseResult.data as Record<string, unknown>;
    const schema = {
      ...body,
      projectId,
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`data:${projectId}:schema`, schema);
    return c.json({ success: true, data: schema });
  } catch (error) {
    console.log(`Error updating schema: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

dataRouter.get("/:projectId/migrations", async (c) => {
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
    const migrations = await kv.get(`data:${projectId}:migrations`);
    return c.json({ success: true, data: migrations || [] });
  } catch (error) {
    console.log(`Error fetching migrations: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

dataRouter.put("/:projectId/migrations", async (c) => {
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
    console.log(`Error updating migrations: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});
