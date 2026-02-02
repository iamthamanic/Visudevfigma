/**
 * VisuDEV Edge Function: Account
 *
 * @version 1.0.0
 * @created 2025-11-06T12:00:00.000Z
 * @updated 2025-11-06T12:00:00.000Z
 *
 * @description User account settings and preferences API
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

// Get account settings
app.get("/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const account = await kvGet(`account:${userId}`);
    return c.json({ success: true, data: account || {} });
  } catch (error) {
    console.log(`Error fetching account: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update account settings
app.put("/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const body = await c.req.json();
    const account = {
      ...body,
      userId,
      updatedAt: new Date().toISOString(),
    };
    await kvSet(`account:${userId}`, account);
    return c.json({ success: true, data: account });
  } catch (error) {
    console.log(`Error updating account: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Get user preferences
app.get("/:userId/preferences", async (c) => {
  try {
    const userId = c.req.param("userId");
    const preferences = await kvGet(`account:${userId}:preferences`);
    return c.json({ success: true, data: preferences || {} });
  } catch (error) {
    console.log(`Error fetching preferences: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update user preferences
app.put("/:userId/preferences", async (c) => {
  try {
    const userId = c.req.param("userId");
    const body = await c.req.json();
    await kvSet(`account:${userId}:preferences`, body);
    return c.json({ success: true, data: body });
  } catch (error) {
    console.log(`Error updating preferences: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
