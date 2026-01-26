/**
 * VisuDEV Edge Function: Data
 * 
 * @version 1.0.0
 * @created 2025-11-06T12:00:00.000Z
 * @updated 2025-11-06T12:00:00.000Z
 * 
 * @description Database schema, ERD, and migrations management API
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

// Get schema for project
app.get("/:projectId/schema", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const schema = await kvGet(`data:${projectId}:schema`);
    return c.json({ success: true, data: schema || {} });
  } catch (error) {
    console.log(`Error fetching schema: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update schema
app.put("/:projectId/schema", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const body = await c.req.json();
    const schema = {
      ...body,
      projectId,
      updatedAt: new Date().toISOString(),
    };
    await kvSet(`data:${projectId}:schema`, schema);
    return c.json({ success: true, data: schema });
  } catch (error) {
    console.log(`Error updating schema: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get migrations for project
app.get("/:projectId/migrations", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const migrations = await kvGet(`data:${projectId}:migrations`);
    return c.json({ success: true, data: migrations || [] });
  } catch (error) {
    console.log(`Error fetching migrations: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update migrations
app.put("/:projectId/migrations", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const body = await c.req.json();
    await kvSet(`data:${projectId}:migrations`, body);
    return c.json({ success: true, data: body });
  } catch (error) {
    console.log(`Error updating migrations: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get ERD data
app.get("/:projectId/erd", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const erd = await kvGet(`data:${projectId}:erd`);
    return c.json({ success: true, data: erd || {} });
  } catch (error) {
    console.log(`Error fetching ERD: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update ERD data
app.put("/:projectId/erd", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const body = await c.req.json();
    const erd = {
      ...body,
      projectId,
      updatedAt: new Date().toISOString(),
    };
    await kvSet(`data:${projectId}:erd`, erd);
    return c.json({ success: true, data: erd });
  } catch (error) {
    console.log(`Error updating ERD: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
