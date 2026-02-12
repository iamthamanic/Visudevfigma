/**
 * Blueprint routes for visudev-server. Single responsibility: blueprint CRUD.
 */
import { Hono } from "hono";
import { kv } from "../lib/kv.ts";
import { requireProjectOwner } from "../lib/auth.ts";

export const blueprintRouter = new Hono();

blueprintRouter.get("/:projectId", async (c) => {
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
    const blueprint = await kv.get(`blueprint:${projectId}`);
    return c.json({ success: true, data: blueprint || {} });
  } catch (error) {
    console.log(`Error fetching blueprint: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

blueprintRouter.put("/:projectId", async (c) => {
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
    const body = (await c.req.json()) as Record<string, unknown>;
    const blueprint = {
      ...body,
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
