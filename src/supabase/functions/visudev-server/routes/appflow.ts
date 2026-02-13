/**
 * AppFlow routes for visudev-server. Single responsibility: app flow CRUD.
 */
import { Hono } from "hono";
import { kv } from "../lib/kv.ts";
import { checkRateLimit } from "../lib/rate-limit.ts";
import { requireProjectOwner } from "../lib/auth.ts";
import { parseJsonBody } from "../lib/parse.ts";
import { createAppFlowBodySchema } from "../lib/schemas/appflow.ts";

export const appflowRouter = new Hono();

appflowRouter.get("/:projectId", async (c) => {
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
    const flows = await kv.getByPrefix(`appflow:${projectId}:`);
    return c.json({ success: true, data: flows });
  } catch (error) {
    console.log(`Error fetching flows: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

appflowRouter.get("/:projectId/:flowId", async (c) => {
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
    const flowId = c.req.param("flowId");
    const flow = await kv.get(`appflow:${projectId}:${flowId}`);
    if (!flow) {
      return c.json({ success: false, error: "Flow not found" }, 404);
    }
    return c.json({ success: true, data: flow });
  } catch (error) {
    console.log(`Error fetching flow: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

appflowRouter.post("/:projectId", async (c) => {
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
    if (!(await checkRateLimit(`rate:appflow:${ownerId}`, 30))) {
      return c.json({ success: false, error: "Rate limit exceeded" }, 429);
    }
    const parseResult = await parseJsonBody(c, createAppFlowBodySchema);
    if (!parseResult.ok) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    const body = parseResult.data as Record<string, unknown>;
    const flowId = (body.flowId as string) || crypto.randomUUID();
    const flow = {
      ...body,
      flowId,
      projectId,
      createdAt: new Date().toISOString(),
    };
    await kv.set(`appflow:${projectId}:${flowId}`, flow);
    return c.json({ success: true, data: flow });
  } catch (error) {
    console.log(`Error creating flow: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

appflowRouter.delete("/:projectId/:flowId", async (c) => {
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
    const flowId = c.req.param("flowId");
    await kv.del(`appflow:${projectId}:${flowId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting flow: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});
