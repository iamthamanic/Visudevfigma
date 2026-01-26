/**
 * VisuDEV Edge Function: Logs
 * 
 * @version 1.0.0
 * @created 2025-11-06T12:00:00.000Z
 * @updated 2025-11-06T12:00:00.000Z
 * 
 * @description Execution logs and trace history API
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

const kvMDel = async (keys: string[]): Promise<void> => {
  const supabase = kvClient();
  const { error } = await supabase.from("kv_store_edf036ef").delete().in("key", keys);
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

// Get logs for project
app.get("/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const logs = await kvGetByPrefix(`logs:${projectId}:`);
    // Sort by timestamp descending
    const sorted = logs.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    return c.json({ success: true, data: sorted });
  } catch (error) {
    console.log(`Error fetching logs: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get single log entry
app.get("/:projectId/:logId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const logId = c.req.param("logId");
    const log = await kvGet(`logs:${projectId}:${logId}`);
    if (!log) {
      return c.json({ success: false, error: "Log not found" }, 404);
    }
    return c.json({ success: true, data: log });
  } catch (error) {
    console.log(`Error fetching log: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Create log entry
app.post("/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const body = await c.req.json();
    const timestamp = new Date().toISOString();
    const logId = `${timestamp}:${crypto.randomUUID()}`;
    const log = {
      ...body,
      projectId,
      timestamp,
      id: logId,
    };
    await kvSet(`logs:${projectId}:${logId}`, log);
    return c.json({ success: true, data: log });
  } catch (error) {
    console.log(`Error creating log: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete all logs for project
app.delete("/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const logs = await kvGetByPrefix(`logs:${projectId}:`);
    const keys = logs.map((log: any) => `logs:${projectId}:${log.id}`);
    if (keys.length > 0) {
      await kvMDel(keys);
    }
    return c.json({ success: true, deleted: keys.length });
  } catch (error) {
    console.log(`Error deleting logs: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete single log entry
app.delete("/:projectId/:logId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const logId = c.req.param("logId");
    await kvDel(`logs:${projectId}:${logId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting log: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
