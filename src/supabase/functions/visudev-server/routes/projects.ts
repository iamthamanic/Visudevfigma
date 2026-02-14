/**
 * Projects routes for visudev-server. Single responsibility: project CRUD.
 */
import { Hono } from "hono";
import type { AppDeps } from "../lib/deps-middleware.ts";
import { RATE_MAX_PROJECTS_PER_WINDOW } from "../lib/rate-limit.ts";
import { getUserIdOptional, requireProjectOwner } from "../lib/auth.ts";
import { parseJsonBody } from "../lib/parse.ts";
import { parseParam, projectIdParamSchema } from "../lib/params.ts";
import {
  createProjectBodySchema,
  updateProjectBodySchema,
} from "../lib/schemas/project.ts";

type ProjectRecord = Record<string, unknown> & { ownerId?: string };

export const projectsRouter = new Hono<{ Variables: AppDeps }>();

projectsRouter.get("/", async (c) => {
  try {
    const kv = c.get("kv");
    const userId = await getUserIdOptional(c);
    if (userId == null) return c.json({ success: true, data: [] });
    const projects = (await kv.getByPrefix("project:")) as ProjectRecord[];
    const owned = projects.filter((project) => project.ownerId === userId);
    return c.json({ success: true, data: owned });
  } catch (error) {
    c.get("logError")("Error fetching projects.", error);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

projectsRouter.get("/:id", async (c) => {
  try {
    const parsed = parseParam(c.req.param("id"), projectIdParamSchema);
    if (!parsed.ok) return c.json({ success: false, error: parsed.error }, 400);
    const id = parsed.data;
    const own = await requireProjectOwner(c, id);
    if (!own.ok) {
      return c.json(
        {
          success: false,
          error: own.status === 404 ? "Project not found" : "Forbidden",
        },
        own.status,
      );
    }
    return c.json({ success: true, data: own.project });
  } catch (error) {
    c.get("logError")("Error fetching project.", error);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

projectsRouter.post("/", async (c) => {
  try {
    const kv = c.get("kv");
    const checkRateLimit = c.get("checkRateLimit");
    if (
      !(await checkRateLimit(
        "rate:projects:create",
        RATE_MAX_PROJECTS_PER_WINDOW,
      ))
    ) {
      return c.json({ success: false, error: "Rate limit exceeded" }, 429);
    }
    const parseResult = await parseJsonBody(c, createProjectBodySchema);
    if (!parseResult.ok) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    const body = parseResult.data as {
      id?: string;
      name?: string;
      description?: string;
      github_repo?: string;
      github_branch?: string;
      preview_mode?: string;
      database_type?: string;
      supabase_project_id?: string;
    };
    const userId = await getUserIdOptional(c);
    if (userId == null) {
      return c.json({
        success: false,
        error: "Authentication required to create project",
      }, 401);
    }
    const id = crypto.randomUUID();
    const project = {
      id,
      ownerId: userId,
      name: body.name,
      description: body.description,
      github_repo: body.github_repo,
      github_branch: body.github_branch,
      preview_mode: body.preview_mode,
      database_type: body.database_type,
      supabase_project_id: body.supabase_project_id,
      screens: [],
      flows: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`project:${id}`, project);
    return c.json({ success: true, data: project });
  } catch (error) {
    c.get("logError")("Error creating project.", error);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

projectsRouter.put("/:id", async (c) => {
  try {
    const parsed = parseParam(c.req.param("id"), projectIdParamSchema);
    if (!parsed.ok) return c.json({ success: false, error: parsed.error }, 400);
    const id = parsed.data;
    const kv = c.get("kv");
    const checkRateLimit = c.get("checkRateLimit");
    const own = await requireProjectOwner(c, id);
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
        : id;
    if (!(await checkRateLimit(`rate:projects:update:${ownerId}`, 30))) {
      return c.json({ success: false, error: "Rate limit exceeded" }, 429);
    }
    const parseResult = await parseJsonBody(c, updateProjectBodySchema);
    if (!parseResult.ok) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    const body = parseResult.data as Record<string, unknown>;
    const updated = {
      ...own.project,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`project:${id}`, updated);
    return c.json({ success: true, data: updated });
  } catch (error) {
    c.get("logError")("Error updating project.", error);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

projectsRouter.delete("/:id", async (c) => {
  try {
    const parsed = parseParam(c.req.param("id"), projectIdParamSchema);
    if (!parsed.ok) return c.json({ success: false, error: parsed.error }, 400);
    const id = parsed.data;
    const kv = c.get("kv");
    const own = await requireProjectOwner(c, id);
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
        : id;
    if (!(await checkRateLimit(`rate:projects:delete:${ownerId}`, 30))) {
      return c.json({ success: false, error: "Rate limit exceeded" }, 429);
    }
    await kv.del(`project:${id}`);
    return c.json({ success: true });
  } catch (error) {
    c.get("logError")("Error deleting project.", error);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});
