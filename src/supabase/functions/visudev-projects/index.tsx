/**
 * VisuDEV Edge Function: Projects
 * 
 * @version 1.0.0
 * @created 2025-11-06T12:00:00.000Z
 * @updated 2025-11-06T12:00:00.000Z
 * 
 * @description Project management API for VisuDEV platform
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

const kvDel = async (key: string): Promise<void> => {
  const supabase = kvClient();
  const { error } = await supabase.from("kv_store_edf036ef").delete().eq("key", key);
  if (error) throw new Error(error.message);
};

const kvGetByPrefix = async (prefix: string): Promise<any[]> => {
  const supabase = kvClient();
  const { data, error } = await supabase.from("kv_store_edf036ef").select("key, value").like("key", prefix + "%");
  if (error) throw new Error(error.message);
  return data?.map((d) => d.value) ?? [];
};

// API Implementation
const app = new Hono().basePath('/visudev-projects');

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

// Get all projects
app.get("/", async (c) => {
  try {
    const projects = await kvGetByPrefix("project:");
    return c.json({ success: true, data: projects });
  } catch (error) {
    console.log(`Error fetching projects: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get single project
app.get("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const project = await kvGet(`project:${id}`);
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
app.post("/", async (c) => {
  try {
    const body = await c.req.json();
    const id = body.id || crypto.randomUUID();
    const project = {
      ...body,
      id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await kvSet(`project:${id}`, project);
    return c.json({ success: true, data: project });
  } catch (error) {
    console.log(`Error creating project: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update project
app.put("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    const body = await c.req.json();
    const existing = await kvGet(`project:${id}`);
    if (!existing) {
      return c.json({ success: false, error: "Project not found" }, 404);
    }
    const updated = {
      ...existing,
      ...body,
      id,
      updatedAt: new Date().toISOString(),
    };
    await kvSet(`project:${id}`, updated);
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.log(`Error updating project: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete project
app.delete("/:id", async (c) => {
  try {
    const id = c.req.param("id");
    await kvDel(`project:${id}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting project: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);