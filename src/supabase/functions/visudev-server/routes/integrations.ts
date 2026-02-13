/**
 * Integrations routes for visudev-server. Single responsibility: GitHub, Supabase integrations.
 */
import { Hono } from "hono";
import type { AppDeps } from "../lib/deps-middleware.ts";
import { requireProjectOwner } from "../lib/auth.ts";
import { redactIntegrations } from "../lib/redact.ts";
import { parseJsonBody } from "../lib/parse.ts";
import { updateIntegrationsBodySchema } from "../lib/schemas/integrations.ts";

export const integrationsRouter = new Hono<{ Variables: AppDeps }>();

integrationsRouter.get("/:projectId", async (c) => {
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
    const integrations = await kv.get(`integrations:${projectId}`);
    return c.json({
      success: true,
      data: redactIntegrations(integrations ?? {}),
    });
  } catch (error) {
    console.log(`Error fetching integrations: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

integrationsRouter.put("/:projectId", async (c) => {
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
    if (!(await checkRateLimit(`rate:integrations:${ownerId}`, 30))) {
      return c.json({ success: false, error: "Rate limit exceeded" }, 429);
    }
    const parseResult = await parseJsonBody(c, updateIntegrationsBodySchema);
    if (!parseResult.ok) {
      return c.json({ success: false, error: parseResult.error }, 400);
    }
    const body = parseResult.data as {
      github?: { token?: string };
      supabase?: { url?: string; serviceKey?: string; projectRef?: string };
    };
    const integrations = {
      github: body.github,
      supabase: body.supabase,
      projectId,
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`integrations:${projectId}`, integrations);
    return c.json({ success: true, data: redactIntegrations(integrations) });
  } catch (error) {
    console.log(`Error updating integrations: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

integrationsRouter.get("/:projectId/github/repos", async (c) => {
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
    if (
      !(await checkRateLimit(`rate:integrations:github:repos:${ownerId}`, 30))
    ) {
      return c.json({ success: false, error: "Rate limit exceeded" }, 429);
    }
    const integrations = await kv.get(`integrations:${projectId}`) as {
      github?: { token?: string };
    } | null;

    if (!integrations?.github?.token) {
      return c.json({ success: false, error: "GitHub not connected" }, 400);
    }

    const response = await fetch("https://api.github.com/user/repos", {
      headers: {
        Authorization: `token ${integrations.github.token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const repos = await response.json();
    return c.json({ success: true, data: repos });
  } catch (error) {
    console.log(`Error fetching GitHub repos: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

integrationsRouter.get("/:projectId/github/content", async (c) => {
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
    if (
      !(await checkRateLimit(
        `rate:integrations:github:content:${ownerId}`,
        30,
      ))
    ) {
      return c.json({ success: false, error: "Rate limit exceeded" }, 429);
    }
    const owner = c.req.query("owner");
    const repo = c.req.query("repo");
    const path = c.req.query("path");
    const ref = c.req.query("ref") || "main";

    if (!owner || !repo || !path) {
      return c.json({ success: false, error: "Missing parameters" }, 400);
    }

    const integrations = await kv.get(`integrations:${projectId}`) as {
      github?: { token?: string };
    } | null;

    if (!integrations?.github?.token) {
      return c.json({ success: false, error: "GitHub not connected" }, 400);
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
      {
        headers: {
          Authorization: `token ${integrations.github.token}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const content = await response.json();
    return c.json({ success: true, data: content });
  } catch (error) {
    console.log(`Error fetching GitHub content: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

integrationsRouter.get("/:projectId/supabase/info", async (c) => {
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
    if (!(await checkRateLimit(`rate:integrations:supabase:${ownerId}`, 30))) {
      return c.json({ success: false, error: "Rate limit exceeded" }, 429);
    }
    const integrations = await kv.get(`integrations:${projectId}`) as {
      supabase?: { url?: string; serviceKey?: string; projectRef?: string };
    } | null;

    if (!integrations?.supabase?.url || !integrations?.supabase?.serviceKey) {
      return c.json({ success: false, error: "Supabase not connected" }, 400);
    }

    return c.json({
      success: true,
      data: {
        url: integrations.supabase.url,
        projectRef: integrations.supabase.projectRef,
        connected: true,
      },
    });
  } catch (error) {
    console.log(`Error fetching Supabase info: ${error}`);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});
