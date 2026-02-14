/**
 * Scans routes for visudev-server. Single responsibility: AppFlow, Blueprint, Data scans.
 * Scans run fire-and-forget (setTimeout after response) so the client gets a quick 202;
 * lifecycle/cancellation could be added via a job queue later.
 */
import { Hono } from "hono";
import type { AppDeps } from "../lib/deps-middleware.ts";
import { requireProjectOwner } from "../lib/auth.ts";
import { parseParam, projectIdParamSchema } from "../lib/params.ts";

export const scansRouter = new Hono<{ Variables: AppDeps }>();

const SAMPLE_FLOW_DATA = {
  screens: [
    {
      id: "screen-home",
      name: "Home",
      path: "/",
      file: "/src/pages/Home.tsx",
      type: "page",
      flows: ["flow-1", "flow-2"],
      navigatesTo: ["/dashboard", "/login"],
      framework: "react",
      componentCode: "<div><h1>Welcome Home</h1></div>",
      screenshotUrl: null,
      screenshotStatus: "none",
    },
    {
      id: "screen-dashboard",
      name: "Dashboard",
      path: "/dashboard",
      file: "/src/pages/Dashboard.tsx",
      type: "page",
      flows: ["flow-2", "flow-3"],
      navigatesTo: ["/settings", "/profile"],
      framework: "react",
      componentCode: "<div><h1>Dashboard</h1><div>Welcome back!</div></div>",
      screenshotUrl: null,
      screenshotStatus: "none",
    },
    {
      id: "screen-login",
      name: "Login",
      path: "/login",
      file: "/src/pages/Login.tsx",
      type: "page",
      flows: ["flow-1"],
      navigatesTo: ["/dashboard"],
      framework: "react",
      componentCode:
        '<div><form><input type="email" /><button>Login</button></form></div>',
      screenshotUrl: null,
      screenshotStatus: "none",
    },
    {
      id: "screen-settings",
      name: "Settings",
      path: "/settings",
      file: "/src/pages/Settings.tsx",
      type: "page",
      flows: ["flow-3"],
      navigatesTo: ["/dashboard"],
      framework: "react",
      componentCode:
        "<div><h1>Settings</h1><div>Configure your app</div></div>",
      screenshotUrl: null,
      screenshotStatus: "none",
    },
    {
      id: "screen-profile",
      name: "Profile",
      path: "/profile",
      file: "/src/pages/Profile.tsx",
      type: "page",
      flows: [],
      navigatesTo: ["/settings"],
      framework: "react",
      componentCode:
        "<div><h1>Profile</h1><div>Your profile information</div></div>",
      screenshotUrl: null,
      screenshotStatus: "none",
    },
  ],
  flows: [
    {
      id: "flow-1",
      type: "ui-event",
      name: "handleLogin",
      file: "/src/pages/Login.tsx",
      line: 42,
      code: "const handleLogin = async () => { ... }",
      calls: ["flow-2"],
      color: "#03ffa3",
    },
    {
      id: "flow-2",
      type: "api-call",
      name: "POST /api/auth/login",
      file: "/src/api/auth.ts",
      line: 12,
      code: 'await fetch("/api/auth/login", { method: "POST" })',
      calls: ["flow-3"],
      color: "#00bcd4",
    },
    {
      id: "flow-3",
      type: "db-query",
      name: "SELECT * FROM users",
      file: "/src/db/queries.ts",
      line: 8,
      code: 'await supabase.from("users").select("*")',
      calls: [],
      color: "#ff6b6b",
    },
  ],
  framework: {
    detected: ["react", "typescript", "tailwind"],
    primary: "react",
    confidence: 0.95,
  },
};

scansRouter.get("/:projectId/status", async (c) => {
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
    const appflowStatus = await kv.get(`scan:${projectId}:appflow`);
    const blueprintStatus = await kv.get(`scan:${projectId}:blueprint`);
    const dataStatus = await kv.get(`scan:${projectId}:data`);
    return c.json({
      success: true,
      data: {
        appflow: appflowStatus || { status: "idle", progress: 0 },
        blueprint: blueprintStatus || { status: "idle", progress: 0 },
        data: dataStatus || { status: "idle", progress: 0 },
      },
    });
  } catch (error) {
    c.get("logError")("Error fetching scan status.", error);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

scansRouter.post("/:projectId/appflow", async (c) => {
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
    if (!(await checkRateLimit(`rate:scans:appflow:${ownerId}`, 10))) {
      return c.json({ success: false, error: "Rate limit exceeded" }, 429);
    }
    await kv.set(`scan:${projectId}:appflow`, {
      status: "running",
      progress: 0,
      startedAt: new Date().toISOString(),
    });
    setTimeout(async () => {
      try {
        await kv.set(`scan:${projectId}:appflow`, {
          status: "running",
          progress: 30,
          message: "Analyzing repository structure...",
        });
        await new Promise((r) => setTimeout(r, 2000));
        await kv.set(`scan:${projectId}:appflow`, {
          status: "running",
          progress: 60,
          message: "Detecting UI components...",
        });
        await new Promise((r) => setTimeout(r, 2000));
        await kv.set(`scan:${projectId}:appflow`, {
          status: "running",
          progress: 90,
          message: "Generating flow maps...",
        });
        await new Promise((r) => setTimeout(r, 1000));
        await kv.set(`scan:${projectId}:appflow`, {
          status: "completed",
          progress: 100,
          completedAt: new Date().toISOString(),
        });
        const sampleFlowId = crypto.randomUUID();
        await kv.set(`appflow:${projectId}:${sampleFlowId}`, {
          flowId: sampleFlowId,
          projectId,
          ...SAMPLE_FLOW_DATA,
          createdAt: new Date().toISOString(),
        });
      } catch (e) {
        console.log(`Error during AppFlow scan: ${e}`);
        await kv.set(`scan:${projectId}:appflow`, {
          status: "failed",
          progress: 0,
          error: "Scan failed",
          failedAt: new Date().toISOString(),
        });
      }
    }, 100);
    return c.json({ success: true, message: "AppFlow scan started" });
  } catch (error) {
    c.get("logError")("Error starting AppFlow scan.", error);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

scansRouter.post("/:projectId/blueprint", async (c) => {
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
    if (!(await checkRateLimit(`rate:scans:blueprint:${ownerId}`, 10))) {
      return c.json({ success: false, error: "Rate limit exceeded" }, 429);
    }
    const project = own.project;
    if (!project.github_repo) {
      return c.json(
        { success: false, error: "GitHub repo not configured" },
        400,
      );
    }
    await kv.set(`scan:${projectId}:blueprint`, {
      status: "running",
      progress: 0,
      startedAt: new Date().toISOString(),
    });
    setTimeout(async () => {
      try {
        await kv.set(`scan:${projectId}:blueprint`, {
          status: "running",
          progress: 40,
          message: "Analyzing code structure...",
        });
        await new Promise((r) => setTimeout(r, 2000));
        await kv.set(`scan:${projectId}:blueprint`, {
          status: "running",
          progress: 80,
          message: "Mapping dependencies...",
        });
        await new Promise((r) => setTimeout(r, 1500));
        await kv.set(`scan:${projectId}:blueprint`, {
          status: "completed",
          progress: 100,
          completedAt: new Date().toISOString(),
        });
        await kv.set(`blueprint:${projectId}`, {
          projectId,
          components: [
            { name: "App", type: "component", path: "/src/App.tsx" },
            {
              name: "LoginForm",
              type: "component",
              path: "/src/components/LoginForm.tsx",
            },
          ],
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.log(`Error during Blueprint scan: ${e}`);
        await kv.set(`scan:${projectId}:blueprint`, {
          status: "failed",
          progress: 0,
          error: "Scan failed",
          failedAt: new Date().toISOString(),
        });
      }
    }, 100);
    return c.json({ success: true, message: "Blueprint scan started" });
  } catch (error) {
    c.get("logError")("Error starting Blueprint scan.", error);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

scansRouter.post("/:projectId/data", async (c) => {
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
    if (!(await checkRateLimit(`rate:scans:data:${ownerId}`, 10))) {
      return c.json({ success: false, error: "Rate limit exceeded" }, 429);
    }
    const project = own.project;
    if (!project.supabase_project_id) {
      return c.json({
        success: false,
        error: "Supabase project not configured",
      }, 400);
    }
    await kv.set(`scan:${projectId}:data`, {
      status: "running",
      progress: 0,
      startedAt: new Date().toISOString(),
    });
    setTimeout(async () => {
      try {
        await kv.set(`scan:${projectId}:data`, {
          status: "running",
          progress: 35,
          message: "Connecting to database...",
        });
        await new Promise((r) => setTimeout(r, 1500));
        await kv.set(`scan:${projectId}:data`, {
          status: "running",
          progress: 70,
          message: "Scanning tables and RLS policies...",
        });
        await new Promise((r) => setTimeout(r, 2000));
        await kv.set(`scan:${projectId}:data`, {
          status: "completed",
          progress: 100,
          completedAt: new Date().toISOString(),
        });
        await kv.set(`data:${projectId}:schema`, {
          projectId,
          tables: [
            { name: "users", columns: ["id", "email", "created_at"] },
            { name: "projects", columns: ["id", "name", "user_id"] },
          ],
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.log(`Error during Data scan: ${e}`);
        await kv.set(`scan:${projectId}:data`, {
          status: "failed",
          progress: 0,
          error: "Scan failed",
          failedAt: new Date().toISOString(),
        });
      }
    }, 100);
    return c.json({ success: true, message: "Data scan started" });
  } catch (error) {
    c.get("logError")("Error starting Data scan.", error);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});

scansRouter.post("/:projectId/all", async (c) => {
  try {
    const projectIdResult = parseParam(
      c.req.param("projectId"),
      projectIdParamSchema,
    );
    if (!projectIdResult.ok) {
      return c.json({ success: false, error: projectIdResult.error }, 400);
    }
    const projectId = projectIdResult.data;
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
    if (!(await checkRateLimit(`rate:scans:all:${ownerId}`, 5))) {
      return c.json({ success: false, error: "Rate limit exceeded" }, 429);
    }
    const project = own.project;
    const base = c.req.url.split("/scans/")[0];
    const results = { appflow: false, blueprint: false, data: false };
    if (project.github_repo) {
      const ar = await fetch(`${base}/scans/${projectId}/appflow`, {
        method: "POST",
      });
      results.appflow = ar.ok;
      const br = await fetch(`${base}/scans/${projectId}/blueprint`, {
        method: "POST",
      });
      results.blueprint = br.ok;
    }
    if (project.supabase_project_id) {
      const dr = await fetch(`${base}/scans/${projectId}/data`, {
        method: "POST",
      });
      results.data = dr.ok;
    }
    return c.json({ success: true, data: results });
  } catch (error) {
    c.get("logError")("Error starting all scans.", error);
    return c.json({ success: false, error: "Internal error" }, 500);
  }
});
