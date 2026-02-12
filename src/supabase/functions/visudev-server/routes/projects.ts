/**
 * Projects routes for visudev-server. Single responsibility: project CRUD.
 */
import { Hono } from "hono";
import { kv } from "../lib/kv.ts";
import { getUserIdOptional, requireProjectOwner } from "../lib/auth.ts";
import {
  checkRateLimit,
  RATE_MAX_PROJECTS_PER_WINDOW,
} from "../lib/rate-limit.ts";
import { createProjectBodySchema } from "../lib/schemas.ts";

type ProjectRecord = Record<string, unknown> & { ownerId?: string };

export const projectsRouter = new Hono();

projectsRouter.get("/", async (c) => {
  try {
    const userId = await getUserIdOptional(c);
    if (userId == null) return c.json({ success: true, data: [] });
    let projects = (await kv.getByPrefix("project:")) as ProjectRecord[];
    projects = projects.filter(
      (p) => p.ownerId == null || p.ownerId === userId,
    );
    return c.json({ success: true, data: projects });
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
    const raw = await c.req.json();
    const parsed = createProjectBodySchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.message }, 400);
    }
    const body = parsed.data as Record<string, unknown>;
    const id = (body.id as string) || crypto.randomUUID();
    const ownerId = (await getUserIdOptional(c)) ?? undefined;
    const project = {
      ...body,
      id,
      ownerId,
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
    const body = (await c.req.json()) as Record<string, unknown>;
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
