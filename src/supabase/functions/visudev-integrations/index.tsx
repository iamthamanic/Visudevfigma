/**
 * VisuDEV Edge Function: Integrations
 * 
 * @version 1.0.0
 * @created 2025-11-06T12:00:00.000Z
 * @updated 2025-11-06T12:00:00.000Z
 * 
 * @description Platform integrations (GitHub, Supabase, GitLab, etc.) API
 */

import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import { createClient } from "jsr:@supabase/supabase-js@2.49.8";

// KV Store Implementation (inline for Dashboard compatibility)
const kvClient = () => createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

const kvSet = async (key: string, value: any): Promise<void> => {
  const supabase = kvClient();
  const { error } = await supabase.from("kv_store_edf036ef").upsert({ key, value });
  if (error) throw new Error(error.message);
};

const kvGet = async (key: string): Promise<any> => {
  const supabase = kvClient();
  const { data, error } = await supabase.from("kv_store_edf036ef").select("value").eq("key", key).maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value;
};

// API Implementation
const app = new Hono();

app.use('*', logger(console.log));
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

// Get integrations for project
app.get("/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const integrations = await kvGet(`integrations:${projectId}`);
    return c.json({ success: true, data: integrations || {} });
  } catch (error) {
    console.log(`Error fetching integrations: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update integrations (GitHub, Supabase, etc.)
app.put("/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const body = await c.req.json();
    const integrations = {
      ...body,
      projectId,
      updatedAt: new Date().toISOString(),
    };
    await kvSet(`integrations:${projectId}`, integrations);
    return c.json({ success: true, data: integrations });
  } catch (error) {
    console.log(`Error updating integrations: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== GITHUB ====================

// Connect GitHub (save token)
app.post("/:projectId/github", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const body = await c.req.json();
    const { token, username } = body;

    if (!token) {
      return c.json({ success: false, error: "Token required" }, 400);
    }

    const integrations = await kvGet(`integrations:${projectId}`) || {};
    integrations.github = {
      token,
      username,
      connectedAt: new Date().toISOString(),
    };
    integrations.updatedAt = new Date().toISOString();

    await kvSet(`integrations:${projectId}`, integrations);
    return c.json({ success: true, data: { connected: true, username } });
  } catch (error) {
    console.log(`Error connecting GitHub: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get GitHub repositories
app.get("/:projectId/github/repos", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const integrations = await kvGet(`integrations:${projectId}`);
    
    if (!integrations?.github?.token) {
      return c.json({ success: false, error: "GitHub not connected" }, 400);
    }

    const response = await fetch("https://api.github.com/user/repos?per_page=100", {
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

// Get GitHub branches
app.get("/:projectId/github/branches", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const owner = c.req.query("owner");
    const repo = c.req.query("repo");

    if (!owner || !repo) {
      return c.json({ success: false, error: "Missing owner or repo" }, 400);
    }

    const integrations = await kvGet(`integrations:${projectId}`);
    
    if (!integrations?.github?.token) {
      return c.json({ success: false, error: "GitHub not connected" }, 400);
    }

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/branches`,
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

    const branches = await response.json();
    return c.json({ success: true, data: branches });
  } catch (error) {
    console.log(`Error fetching GitHub branches: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get GitHub file/directory content
app.get("/:projectId/github/content", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const owner = c.req.query("owner");
    const repo = c.req.query("repo");
    const path = c.req.query("path") || "";
    const ref = c.req.query("ref") || "main";

    if (!owner || !repo) {
      return c.json({ success: false, error: "Missing owner or repo" }, 400);
    }

    const integrations = await kvGet(`integrations:${projectId}`);
    
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

// Disconnect GitHub
app.delete("/:projectId/github", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const integrations = await kvGet(`integrations:${projectId}`) || {};
    
    delete integrations.github;
    integrations.updatedAt = new Date().toISOString();

    await kvSet(`integrations:${projectId}`, integrations);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error disconnecting GitHub: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// ==================== SUPABASE ====================

// Connect Supabase
app.post("/:projectId/supabase", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const body = await c.req.json();
    const { url, anonKey, serviceKey, projectRef } = body;

    if (!url || !anonKey) {
      return c.json({ success: false, error: "URL and anon key required" }, 400);
    }

    const integrations = await kvGet(`integrations:${projectId}`) || {};
    integrations.supabase = {
      url,
      anonKey,
      serviceKey,
      projectRef,
      connectedAt: new Date().toISOString(),
    };
    integrations.updatedAt = new Date().toISOString();

    await kvSet(`integrations:${projectId}`, integrations);
    return c.json({ success: true, data: { connected: true, url, projectRef } });
  } catch (error) {
    console.log(`Error connecting Supabase: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get Supabase info
app.get("/:projectId/supabase", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const integrations = await kvGet(`integrations:${projectId}`);
    
    if (!integrations?.supabase?.url) {
      return c.json({ success: false, error: "Supabase not connected" }, 400);
    }

    // Return info without exposing service key
    return c.json({ 
      success: true, 
      data: {
        url: integrations.supabase.url,
        projectRef: integrations.supabase.projectRef,
        connected: true,
        connectedAt: integrations.supabase.connectedAt,
      }
    });
  } catch (error) {
    console.log(`Error fetching Supabase info: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Disconnect Supabase
app.delete("/:projectId/supabase", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const integrations = await kvGet(`integrations:${projectId}`) || {};
    
    delete integrations.supabase;
    integrations.updatedAt = new Date().toISOString();

    await kvSet(`integrations:${projectId}`, integrations);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error disconnecting Supabase: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
