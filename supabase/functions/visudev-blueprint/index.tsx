/**
 * VisuDEV Edge Function: Blueprint
 *
 * @version 1.0.0
 * @created 2025-11-06T12:00:00.000Z
 * @updated 2025-11-06T12:00:00.000Z
 *
 * @description Architecture blueprint and layer visualization API
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createClient } from "@jsr/supabase__supabase-js";

// KV Store Implementation (inline for Dashboard compatibility)
const kvClient = () =>
  createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

const kvSet = async (key: string, value: unknown): Promise<void> => {
  const supabase = kvClient();
  const { error } = await supabase.from("kv_store_edf036ef").upsert({
    key,
    value,
  });
  if (error) throw new Error(error.message);
};

const kvGet = async (key: string): Promise<unknown> => {
  const supabase = kvClient();
  const { data, error } = await supabase
    .from("kv_store_edf036ef")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.value;
};

const kvDel = async (key: string): Promise<void> => {
  const supabase = kvClient();
  const { error } = await supabase.from("kv_store_edf036ef").delete().eq("key", key);
  if (error) throw new Error(error.message);
};

// API Implementation
const app = new Hono();

app.use("*", logger(console.log));
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

// Get blueprint for project
app.get("/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const blueprint = await kvGet(`blueprint:${projectId}`);
    return c.json({ success: true, data: blueprint || {} });
  } catch (error) {
    console.log(`Error fetching blueprint: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update blueprint
app.put("/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    const body = await c.req.json();
    const blueprint = {
      ...body,
      projectId,
      updatedAt: new Date().toISOString(),
    };
    await kvSet(`blueprint:${projectId}`, blueprint);
    return c.json({ success: true, data: blueprint });
  } catch (error) {
    console.log(`Error updating blueprint: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Delete blueprint
app.delete("/:projectId", async (c) => {
  try {
    const projectId = c.req.param("projectId");
    await kvDel(`blueprint:${projectId}`);
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting blueprint: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
