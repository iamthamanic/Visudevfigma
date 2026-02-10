/**
 * VisuDEV Edge Function: Account
 *
 * @version 1.0.0
 * @created 2025-11-06T12:00:00.000Z
 * @updated 2025-11-06T12:00:00.000Z
 *
 * @description User account settings and preferences API.
 * IDOR: Only the authenticated user can read/update their own account (JWT sub must match :userId).
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { createClient } from "@jsr/supabase__supabase-js";
import { z } from "zod";

/** Returns user id from Bearer JWT or null. Used for account ownership (IDOR mitigation). */
async function getUserIdOptional(
  authHeader: string | undefined,
): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) return null;
  try {
    const supabase = createClient(url, key);
    const { data } = await supabase.auth.getUser(token);
    return data?.user?.id ?? null;
  } catch (e) {
    console.warn("[getUserIdOptional] auth.getUser failed", {
      message: e instanceof Error ? e.message : String(e),
    });
    return null;
  }
}

const accountBodySchema = z.record(z.unknown()).refine(
  (obj) => JSON.stringify(obj).length <= 20_000,
  { message: "Account payload too large" },
);
const preferencesBodySchema = z.record(z.unknown()).refine(
  (obj) => JSON.stringify(obj).length <= 10_000,
  { message: "Preferences payload too large" },
);

// KV Store Implementation (inline for Dashboard compatibility)
const kvClient = () =>
  createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

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

// Get account settings (IDOR: only owner)
app.get("/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const authUserId = await getUserIdOptional(c.req.header("Authorization"));
    if (authUserId === null || authUserId !== userId) {
      return c.json({ success: false, error: "Forbidden" }, 403);
    }
    const account = await kvGet(`account:${userId}`);
    return c.json({ success: true, data: account || {} });
  } catch (error) {
    console.log(`Error fetching account: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update account settings (IDOR: only owner)
app.put("/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    const authUserId = await getUserIdOptional(c.req.header("Authorization"));
    if (authUserId === null || authUserId !== userId) {
      return c.json({ success: false, error: "Forbidden" }, 403);
    }
    const raw = await c.req.json();
    const parsed = accountBodySchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.message }, 400);
    }
    const body = parsed.data as Record<string, unknown>;
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

// Get user preferences (IDOR: only owner)
app.get("/:userId/preferences", async (c) => {
  try {
    const userId = c.req.param("userId");
    const authUserId = await getUserIdOptional(c.req.header("Authorization"));
    if (authUserId === null || authUserId !== userId) {
      return c.json({ success: false, error: "Forbidden" }, 403);
    }
    const preferences = await kvGet(`account:${userId}:preferences`);
    return c.json({ success: true, data: preferences || {} });
  } catch (error) {
    console.log(`Error fetching preferences: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// Update user preferences (IDOR: only owner)
app.put("/:userId/preferences", async (c) => {
  try {
    const userId = c.req.param("userId");
    const authUserId = await getUserIdOptional(c.req.header("Authorization"));
    if (authUserId === null || authUserId !== userId) {
      return c.json({ success: false, error: "Forbidden" }, 403);
    }
    const raw = await c.req.json();
    const parsed = preferencesBodySchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ success: false, error: parsed.error.message }, 400);
    }
    const body = parsed.data;
    await kvSet(`account:${userId}:preferences`, body);
    return c.json({ success: true, data: body });
  } catch (error) {
    console.log(`Error updating preferences: ${error}`);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

Deno.serve(app.fetch);
