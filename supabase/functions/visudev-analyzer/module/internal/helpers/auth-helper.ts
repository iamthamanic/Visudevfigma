/**
 * Optional JWT auth for IDOR mitigation. Returns user id from Bearer token or null.
 */
import { createClient } from "@jsr/supabase__supabase-js";
import type { Context } from "hono";

export async function getUserIdOptional(c: Context): Promise<string | null> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7).trim();
  if (!token) return null;
  const url = Deno.env.get("SUPABASE_URL");
  const serviceRole = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !serviceRole) return null;
  try {
    const supabase = createClient(url, serviceRole);
    const { data } = await supabase.auth.getUser(token);
    return data?.user?.id ?? null;
  } catch (e) {
    console.warn("[getUserIdOptional] auth.getUser failed", e instanceof Error ? e.message : String(e));
    return null;
  }
}
