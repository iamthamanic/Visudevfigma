/**
 * Blueprint routes for visudev-server. Single responsibility: blueprint CRUD.
 */
import { Hono } from "hono";
import type { AppDeps } from "../lib/deps-middleware.ts";
import { requireProjectOwner } from "../lib/auth.ts";
import { parseJsonBody } from "../lib/parse.ts";
import { updateBlueprintBodySchema } from "../lib/schemas/blueprint.ts";

export const blueprintRouter = new Hono<{ Variables: AppDeps }>();

blueprintRouter.get("/:projectId", async (c) => {
  try {
    const kv = c.get("kv");
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
    const blueprint = await kv.get(`blueprint:${projectId}`);
    return c.json({ success: true, data: blueprint || {} });
  } catch (error) {
    console.log(`Error fetching blueprint: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

blueprintRouter.put("/:projectId", async (c) => {
  try {
    const kv = c.get("kv");
    const checkRateLimit = c.get("checkRateLimit");
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
    if (!(await checkRateLimit(`rate:blueprint:${ownerId}`, 30))) {
      return c.json({ success: false, error: "Rate limit exceeded" }, 429);
    }
    const parseResult = await parseJsonBody(c, updateBlueprintBodySchema);
    if (!parseResult.ok) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    const body = parseResult.data as {
      components?: unknown[];
      violations?: unknown[];
      cycles?: unknown[];
    };
    const blueprint = {
      components: body.components,
      violations: body.violations,
      cycles: body.cycles,
      projectId,
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`blueprint:${projectId}`, blueprint);
    return c.json({ success: true, data: blueprint });
  } catch (error) {
    console.log(`Error updating blueprint: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});
