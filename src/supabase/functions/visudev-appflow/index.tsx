/**
 * VisuDEV Edge Function: AppFlow
 * 
 * @version 1.0.0
 * @created 2025-11-06T12:00:00.000Z
 * @updated 2025-11-06T12:00:00.000Z
 * 
 * @description Flow trace visualization and UI-to-code mapping API
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

// Get flows for project
app.get("/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const flows = await kvGetByPrefix(`appflow:${projectId}:`);
    return c.json({ success: true, data: flows });
  } catch (error) {
    console.log(`Error fetching flows: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get single flow
app.get("/:projectId/:flowId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const flowId = c.req.param("flowId");
    const flow = await kvGet(`appflow:${projectId}:${flowId}`);
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
app.post("/:projectId", async (c) => {
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
    await kvSet(`appflow:${projectId}:${flowId}`, flow);
    return c.json({ success: true, data: flow });
  } catch (error) {
    console.log(`Error creating flow: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update flow
app.put("/:projectId/:flowId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const flowId = c.req.param("flowId");
    const body = await c.req.json();
    const existing = await kvGet(`appflow:${projectId}:${flowId}`);
    if (!existing) {
      return c.json({ success: false, error: "Flow not found" }, 404);
    }
    const updated = {
      ...existing,
      ...body,
      flowId,
      projectId,
      updatedAt: new Date().toISOString(),
    };
    await kvSet(`appflow:${projectId}:${flowId}`, updated);
    return c.json({ success: true, data: updated });
  } catch (error) {
    console.log(`Error updating flow: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete flow
app.delete("/:projectId/:flowId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const flowId = c.req.param("flowId");
    await kvDel(`appflow:${projectId}:${flowId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting flow: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
