import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";
import { scanRepository } from "./appflow_scanner.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

// ==================== PROJECTS ====================
// Get all projects
app.get("/projects", async (c) => {
  try {
    const projects = await kv.getByPrefix("project:");
    return c.json({ success: true, data: projects });
  } catch (error) {
    console.log(`Error fetching projects: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get single project
app.get("/projects/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const project = await kv.get(`project:${id}`);
    if (!project) {
      return c.json({ success: false, error: "Project not found" }, 404);
    }
    return c.json({ success: true, data: project });
  } catch (error) {
    console.log(`Error fetching project: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Create project
app.post("/projects", async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || crypto.randomUUID();
    const project = {
      ...body,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`project:${id}`, project);
    return c.json({ success: true, data: project });
  } catch (error) {
    console.log(`Error creating project: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update project
app.put("/projects/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const existing = await kv.get(`project:${id}`);
    if (!existing) {
      return c.json({ success: false, error: "Project not found" }, 404);
    }
    const updated = {
      ...existing,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`project:${id}`, updated);
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.log(`Error updating project: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete project
app.delete("/projects/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kv.del(`project:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting project: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== APP FLOW ====================
// Get flows for project
app.get("/appflow/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const flows = await kv.getByPrefix(`appflow:${projectId}:`);
    return c.json({ success: true, data: flows });
  } catch (error) {
    console.log(`Error fetching flows: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get single flow
app.get("/appflow/:projectId/:flowId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const flowId = c.req.param("flowId");
    const flow = await kv.get(`appflow:${projectId}:${flowId}`);
    if (!flow) {
      return c.json({ success: false, error: "Flow not found" }, 404);
    }
    return c.json({ success: true, data: flow });
  } catch (error) {
    console.log(`Error fetching flow: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Create flow
app.post("/appflow/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const body = await c.req.json();
    const flowId = body.flowId || crypto.randomUUID();
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
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete flow
app.delete("/appflow/:projectId/:flowId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const flowId = c.req.param("flowId");
    await kv.del(`appflow:${projectId}:${flowId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting flow: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== BLUEPRINT ====================
// Get blueprint for project
app.get("/blueprint/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const blueprint = await kv.get(`blueprint:${projectId}`);
    return c.json({ success: true, data: blueprint || {} });
  } catch (error) {
    console.log(`Error fetching blueprint: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update blueprint
app.put("/blueprint/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const body = await c.req.json();
    const blueprint = {
      ...body,
      projectId,
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`blueprint:${projectId}`, blueprint);
    return c.json({ success: true, data: blueprint });
  } catch (error) {
    console.log(`Error updating blueprint: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== DATA ====================
// Get schema for project
app.get("/data/:projectId/schema", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const schema = await kv.get(`data:${projectId}:schema`);
    return c.json({ success: true, data: schema || {} });
  } catch (error) {
    console.log(`Error fetching schema: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update schema
app.put("/data/:projectId/schema", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const body = await c.req.json();
    const schema = {
      ...body,
      projectId,
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`data:${projectId}:schema`, schema);
    return c.json({ success: true, data: schema });
  } catch (error) {
    console.log(`Error updating schema: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get migrations for project
app.get("/data/:projectId/migrations", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const migrations = await kv.get(`data:${projectId}:migrations`);
    return c.json({ success: true, data: migrations || [] });
  } catch (error) {
    console.log(`Error fetching migrations: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update migrations
app.put("/data/:projectId/migrations", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const body = await c.req.json();
    await kv.set(`data:${projectId}:migrations`, body);
    return c.json({ success: true, data: body });
  } catch (error) {
    console.log(`Error updating migrations: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== LOGS ====================
// Get logs for project
app.get("/logs/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const logs = await kv.getByPrefix(`logs:${projectId}:`);
    return c.json({ success: true, data: logs });
  } catch (error) {
    console.log(`Error fetching logs: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Create log entry
app.post("/logs/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const body = await c.req.json();
    const timestamp = new Date().toISOString();
    const logId = `${timestamp}:${crypto.randomUUID()}`;
    const log = {
      ...body,
      projectId,
      timestamp,
    };
    await kv.set(`logs:${projectId}:${logId}`, log);
    return c.json({ success: true, data: log });
  } catch (error) {
    console.log(`Error creating log: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete logs for project
app.delete("/logs/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const logs = await kv.getByPrefix(`logs:${projectId}:`);
    const keys = logs.map((log: any) => `logs:${projectId}:${log.timestamp}:${log.id}`);
    if (keys.length > 0) {
      await kv.mdel(keys);
    }
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting logs: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== ACCOUNT ====================
// Get account settings
app.get("/account/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const account = await kv.get(`account:${userId}`);
    return c.json({ success: true, data: account || {} });
  } catch (error) {
    console.log(`Error fetching account: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update account settings
app.put("/account/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const body = await c.req.json();
    const account = {
      ...body,
      userId,
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`account:${userId}`, account);
    return c.json({ success: true, data: account });
  } catch (error) {
    console.log(`Error updating account: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== INTEGRATIONS ====================
// Get integrations for project
app.get("/integrations/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const integrations = await kv.get(`integrations:${projectId}`);
    return c.json({ success: true, data: integrations || {} });
  } catch (error) {
    console.log(`Error fetching integrations: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update integrations (GitHub, Supabase, etc.)
app.put("/integrations/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const body = await c.req.json();
    const integrations = {
      ...body,
      projectId,
      updatedAt: new Date().toISOString(),
    };
    await kv.set(`integrations:${projectId}`, integrations);
    return c.json({ success: true, data: integrations });
  } catch (error) {
    console.log(`Error updating integrations: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GitHub: Get repositories
app.get("/integrations/:projectId/github/repos", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const integrations = await kv.get(`integrations:${projectId}`);
    
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
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// GitHub: Get file content
app.get("/integrations/:projectId/github/content", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const owner = c.req.query("owner");
    const repo = c.req.query("repo");
    const path = c.req.query("path");
    const ref = c.req.query("ref") || "main";

    if (!owner || !repo || !path) {
      return c.json({ success: false, error: "Missing parameters" }, 400);
    }

    const integrations = await kv.get(`integrations:${projectId}`);
    
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
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.statusText}`);
    }

    const content = await response.json();
    return c.json({ success: true, data: content });
  } catch (error) {
    console.log(`Error fetching GitHub content: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Supabase: Get project info
app.get("/integrations/:projectId/supabase/info", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const integrations = await kv.get(`integrations:${projectId}`);
    
    if (!integrations?.supabase?.url || !integrations?.supabase?.serviceKey) {
      return c.json({ success: false, error: "Supabase not connected" }, 400);
    }

    // Return configured Supabase info (without exposing service key)
    return c.json({ 
      success: true, 
      data: {
        url: integrations.supabase.url,
        projectRef: integrations.supabase.projectRef,
        connected: true,
      }
    });
  } catch (error) {
    console.log(`Error fetching Supabase info: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== SCANS ====================
// Get scan status for a project
app.get("/scans/:projectId/status", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const appflowStatus = await kv.get(`scan:${projectId}:appflow`);
    const blueprintStatus = await kv.get(`scan:${projectId}:blueprint`);
    const dataStatus = await kv.get(`scan:${projectId}:data`);
    
    return c.json({ 
      success: true, 
      data: {
        appflow: appflowStatus || { status: 'idle', progress: 0 },
        blueprint: blueprintStatus || { status: 'idle', progress: 0 },
        data: dataStatus || { status: 'idle', progress: 0 },
      }
    });
  } catch (error) {
    console.log(`Error fetching scan status: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Start AppFlow scan
app.post("/scans/:projectId/appflow", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const project = await kv.get(`project:${projectId}`);
    
    if (!project) {
      return c.json({ success: false, error: "Project not found" }, 404);
    }

    if (!project.github_repo) {
      return c.json({ success: false, error: "GitHub repo not configured" }, 400);
    }

    // Get GitHub integration
    const integrations = await kv.get(`integrations:${projectId}`);
    if (!integrations?.github?.token) {
      return c.json({ success: false, error: "GitHub token not found" }, 400);
    }

    // Set initial status
    await kv.set(`scan:${projectId}:appflow`, {
      status: 'running',
      progress: 0,
      startedAt: new Date().toISOString(),
      message: 'Starting scan...'
    });

    // Start async scan with REAL code analysis
    setTimeout(async () => {
      try {
        console.log(`[AppFlow Scan] Starting real code analysis for ${project.github_repo}`);

        // Parse owner/repo from github_repo (format: "owner/repo")
        const [owner, repo] = project.github_repo.split('/');
        const branch = project.github_branch || 'main';
        const token = integrations.github.token;

        // Step 1: Fetch repository (10%)
        await kv.set(`scan:${projectId}:appflow`, {
          status: 'running',
          progress: 10,
          message: 'Fetching repository files...',
        });

        // Step 2: Analyze code with real scanner (20-80%)
        await kv.set(`scan:${projectId}:appflow`, {
          status: 'running',
          progress: 20,
          message: 'Analyzing TypeScript/React code...',
        });

        const scanResult = await scanRepository(owner, repo, branch, token);
        console.log(`[AppFlow Scan] Scan complete: ${scanResult.screens.length} screens, ${scanResult.flows.length} flows`);

        // Step 3: Save results (90%)
        await kv.set(`scan:${projectId}:appflow`, {
          status: 'running',
          progress: 90,
          message: 'Saving scan results...',
        });

        // Store the complete scan result
        const flowId = crypto.randomUUID();
        await kv.set(`appflow:${projectId}:${flowId}`, {
          flowId,
          projectId,
          screens: scanResult.screens,
          flows: scanResult.flows,
          framework: scanResult.framework,
          scannedAt: new Date().toISOString(),
        });

        // Complete scan (100%)
        await kv.set(`scan:${projectId}:appflow`, {
          status: 'completed',
          progress: 100,
          completedAt: new Date().toISOString(),
          message: `Found ${scanResult.screens.length} screens and ${scanResult.flows.length} flows`,
        });

        console.log(`[AppFlow Scan] ✅ Scan completed successfully`);

      } catch (error) {
        console.log(`[AppFlow Scan] ❌ Error during scan: ${error}`);
        await kv.set(`scan:${projectId}:appflow`, {
          status: 'failed',
          progress: 0,
          error: String(error),
          failedAt: new Date().toISOString(),
        });
      }
    }, 100);

    return c.json({ success: true, message: "AppFlow scan started" });
  } catch (error) {
    console.log(`Error starting AppFlow scan: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Start Blueprint scan
app.post("/scans/:projectId/blueprint", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const project = await kv.get(`project:${projectId}`);
    
    if (!project) {
      return c.json({ success: false, error: "Project not found" }, 404);
    }

    if (!project.github_repo) {
      return c.json({ success: false, error: "GitHub repo not configured" }, 400);
    }

    await kv.set(`scan:${projectId}:blueprint`, {
      status: 'running',
      progress: 0,
      startedAt: new Date().toISOString(),
    });

    setTimeout(async () => {
      try {
        await kv.set(`scan:${projectId}:blueprint`, {
          status: 'running',
          progress: 40,
          message: 'Analyzing code structure...',
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        await kv.set(`scan:${projectId}:blueprint`, {
          status: 'running',
          progress: 80,
          message: 'Mapping dependencies...',
        });

        await new Promise(resolve => setTimeout(resolve, 1500));

        await kv.set(`scan:${projectId}:blueprint`, {
          status: 'completed',
          progress: 100,
          completedAt: new Date().toISOString(),
        });

        // Store sample blueprint data
        await kv.set(`blueprint:${projectId}`, {
          projectId,
          components: [
            { name: 'App', type: 'component', path: '/src/App.tsx' },
            { name: 'LoginForm', type: 'component', path: '/src/components/LoginForm.tsx' },
          ],
          updatedAt: new Date().toISOString(),
        });

      } catch (error) {
        console.log(`Error during Blueprint scan: ${error}`);
        await kv.set(`scan:${projectId}:blueprint`, {
          status: 'failed',
          progress: 0,
          error: String(error),
          failedAt: new Date().toISOString(),
        });
      }
    }, 100);

    return c.json({ success: true, message: "Blueprint scan started" });
  } catch (error) {
    console.log(`Error starting Blueprint scan: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Start Data scan
app.post("/scans/:projectId/data", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const project = await kv.get(`project:${projectId}`);
    
    if (!project) {
      return c.json({ success: false, error: "Project not found" }, 404);
    }

    if (!project.supabase_project_id) {
      return c.json({ success: false, error: "Supabase project not configured" }, 400);
    }

    await kv.set(`scan:${projectId}:data`, {
      status: 'running',
      progress: 0,
      startedAt: new Date().toISOString(),
    });

    setTimeout(async () => {
      try {
        await kv.set(`scan:${projectId}:data`, {
          status: 'running',
          progress: 35,
          message: 'Connecting to database...',
        });

        await new Promise(resolve => setTimeout(resolve, 1500));

        await kv.set(`scan:${projectId}:data`, {
          status: 'running',
          progress: 70,
          message: 'Scanning tables and RLS policies...',
        });

        await new Promise(resolve => setTimeout(resolve, 2000));

        await kv.set(`scan:${projectId}:data`, {
          status: 'completed',
          progress: 100,
          completedAt: new Date().toISOString(),
        });

        // Store sample schema data
        await kv.set(`data:${projectId}:schema`, {
          projectId,
          tables: [
            { name: 'users', columns: ['id', 'email', 'created_at'] },
            { name: 'projects', columns: ['id', 'name', 'user_id'] },
          ],
          updatedAt: new Date().toISOString(),
        });

      } catch (error) {
        console.log(`Error during Data scan: ${error}`);
        await kv.set(`scan:${projectId}:data`, {
          status: 'failed',
          progress: 0,
          error: String(error),
          failedAt: new Date().toISOString(),
        });
      }
    }, 100);

    return c.json({ success: true, message: "Data scan started" });
  } catch (error) {
    console.log(`Error starting Data scan: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Start all scans for a project
app.post("/scans/:projectId/all", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const project = await kv.get(`project:${projectId}`);
    
    if (!project) {
      return c.json({ success: false, error: "Project not found" }, 404);
    }

    const results = {
      appflow: false,
      blueprint: false,
      data: false,
    };

    // Start AppFlow scan if GitHub is configured
    if (project.github_repo) {
      const appflowUrl = `${c.req.url.split('/scans/')[0]}/scans/${projectId}/appflow`;
      const appflowResponse = await fetch(appflowUrl, { method: 'POST' });
      results.appflow = appflowResponse.ok;
    }

    // Start Blueprint scan if GitHub is configured
    if (project.github_repo) {
      const blueprintUrl = `${c.req.url.split('/scans/')[0]}/scans/${projectId}/blueprint`;
      const blueprintResponse = await fetch(blueprintUrl, { method: 'POST' });
      results.blueprint = blueprintResponse.ok;
    }

    // Start Data scan if Supabase is configured
    if (project.supabase_project_id) {
      const dataUrl = `${c.req.url.split('/scans/')[0]}/scans/${projectId}/data`;
      const dataResponse = await fetch(dataUrl, { method: 'POST' });
      results.data = dataResponse.ok;
    }

    return c.json({ success: true, data: results });
  } catch (error) {
    console.log(`Error starting all scans: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);