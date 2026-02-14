/**
 * AppFlow routes for visudev-server. Single responsibility: app flow CRUD.
 */
import { Hono } from "hono";
import type { AppDeps } from "../lib/deps-middleware.ts";
import { requireProjectOwner } from "../lib/auth.ts";
import {
  flowIdParamSchema,
  parseParam,
  projectIdParamSchema,
} from "../lib/params.ts";
import { parseJsonBody } from "../lib/parse.ts";
import { createAppFlowBodySchema } from "../lib/schemas/appflow.ts";

export const appflowRouter = new Hono<{ Variables: AppDeps }>();

appflowRouter.get("/:projectId", async (c) => {
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
    const flows = await kv.getByPrefix(`appflow:${projectId}:`);
    return c.json({ success: true, data: flows });
  } catch (error) {
    c.get("logError")("Error fetching flows.", error);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

appflowRouter.get("/:projectId/:flowId", async (c) => {
  try {
    const projectIdResult = parseParam(
      c.req.param("projectId"),
      projectIdParamSchema,
    );
    const flowIdResult = parseParam(c.req.param("flowId"), flowIdParamSchema);
    if (!projectIdResult.ok) {
      return c.json({ success: false, error: projectIdResult.error }, 400);
    }
    if (!flowIdResult.ok) {
      return c.json({ success: false, error: flowIdResult.error }, 400);
    }
    const projectId = projectIdResult.data;
    const flowId = flowIdResult.data;
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
    const flow = await kv.get(`appflow:${projectId}:${flowId}`);
    if (!flow) {
      return c.json({ success: false, error: "Flow not found" }, 404);
    }
    return c.json({ success: true, data: flow });
  } catch (error) {
    c.get("logError")("Error fetching flow.", error);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

appflowRouter.post("/:projectId", async (c) => {
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
    if (!(await checkRateLimit(`rate:appflow:${ownerId}`, 30))) {
      return c.json({ success: false, error: "Rate limit exceeded" }, 429);
    }
    const parseResult = await parseJsonBody(c, createAppFlowBodySchema);
    if (!parseResult.ok) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    const body = parseResult.data as {
      flowId?: string;
      screens?: unknown[];
      flows?: unknown[];
      framework?: string;
    };
    const flowId = body.flowId || crypto.randomUUID();
    const flow = {
      flowId,
      projectId,
      screens: body.screens,
      flows: body.flows,
      framework: body.framework,
      createdAt: new Date().toISOString(),
    };
    await kv.set(`appflow:${projectId}:${flowId}`, flow);
    return c.json({ success: true, data: flow });
  } catch (error) {
    c.get("logError")("Error creating flow.", error);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

appflowRouter.delete("/:projectId/:flowId", async (c) => {
  try {
    const projectIdResult = parseParam(
      c.req.param("projectId"),
      projectIdParamSchema,
    );
    const flowIdResult = parseParam(c.req.param("flowId"), flowIdParamSchema);
    if (!projectIdResult.ok) {
      return c.json({ success: false, error: projectIdResult.error }, 400);
    }
    if (!flowIdResult.ok) {
      return c.json({ success: false, error: flowIdResult.error }, 400);
    }
    const projectId = projectIdResult.data;
    const flowId = flowIdResult.data;
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
    if (!(await checkRateLimit(`rate:appflow:delete:${ownerId}`, 30))) {
      return c.json({ success: false, error: "Rate limit exceeded" }, 429);
    }
    await kv.del(`appflow:${projectId}:${flowId}`);
    return c.json({ success: true });
  } catch (error) {
    c.get("logError")("Error deleting flow.", error);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});
