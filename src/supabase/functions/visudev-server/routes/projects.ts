/**
 * Projects routes for visudev-server. Single responsibility: project CRUD.
 */
import { Hono } from "hono";
import { kv } from "../lib/kv.ts";
import {
  checkRateLimit,
  RATE_MAX_PROJECTS_PER_WINDOW,
} from "../lib/rate-limit.ts";
import { getUserIdOptional, requireProjectOwner } from "../lib/auth.ts";
import { parseJsonBody } from "../lib/parse.ts";
import {
  createProjectBodySchema,
  updateProjectBodySchema,
} from "../lib/schemas/project.ts";

type ProjectRecord = Record<string, unknown> & { ownerId?: string };

export const projectsRouter = new Hono();

projectsRouter.get("/", async (c) => {
  try {
    const userId = await getUserIdOptional(c);
    if (userId == null) return c.json({ success: true, data: [] });
    const projects = (await kv.getByPrefix("project:")) as ProjectRecord[];
    const owned = projects.filter((p) => p.ownerId === userId);
    return c.json({ success: true, data: owned });
  } catch (error) {
    console.log(`Error fetching projects: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

projectsRouter.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
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
    console.log(`Error fetching project: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

projectsRouter.post("/", async (c) => {
  try {
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
    const body = parseResult.data as Record<string, unknown>;
    const userId = await getUserIdOptional(c);
    if (userId == null) {
      return c.json({
        success: false,
        error: "Authentication required to create project",
      }, 401);
    }
    const id = (body.id as string) || crypto.randomUUID();
    const project = {
      ...body,
      id,
      ownerId: userId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`project:${id}`, project);
    return c.json({ success: true, data: project });
  } catch (error) {
    console.log(`Error creating project: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

projectsRouter.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
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
    console.log(`Error updating project: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

projectsRouter.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
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
    await kv.del(`project:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting project: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});
