/**
 * Extracts Supabase user id from request Bearer JWT.
 * Uses Auth API only (supabase.auth.getUser); no unsigned JWT decode to prevent impersonation.
 */
import { createClient } from "@jsr/supabase__supabase-js";
import type { Context } from "hono";
import { UnauthorizedException } from "../exceptions/index.ts";

function isAllowedSupabaseUrl(u: string): boolean {
  try {
    const url = new URL(u);
    const host = url.hostname.toLowerCase();
    if (host === "127.0.0.1" || host === "localhost") return true;
    if (host.endsWith(".supabase.co")) return true;
    return false;
  } catch {
    return false;
  }
}

/** From inside Docker, 127.0.0.1 is the container; use host.docker.internal to reach the host. */
function urlReachableFromDocker(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === "127.0.0.1" || u.hostname === "localhost") {
      u.hostname = "host.docker.internal";
      return u.origin;
    }
    return url.replace(/\/$/, "");
  } catch {
    return url;
  }
}

/** Auth base URL: prefer env (not client-controlled) to prevent bypass. X-Supabase-URL only if env not set. */
function getAuthBaseUrl(c: Context): string {
  const fromEnv = Deno.env.get("VISUDEV_PUBLIC_URL") ??
    Deno.env.get("SUPABASE_URL");
  if (fromEnv) return urlReachableFromDocker(fromEnv.replace(/\/$/, ""));
  const fromHeader = c.req.header("X-Supabase-URL");
  if (fromHeader && isAllowedSupabaseUrl(fromHeader)) {
    return urlReachableFromDocker(fromHeader.replace(/\/$/, ""));
  }
  try {
    return urlReachableFromDocker(new URL(c.req.url).origin);
  } catch {
    throw new UnauthorizedException("Please sign in again");
  }
}

export async function getAuthUserIdFromContext(
  c: Context,
  _supabase: unknown,
): Promise<string> {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedException("Please sign in first");
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new UnauthorizedException("Please sign in first");
  }
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) {
    throw new UnauthorizedException("Please sign in again");
  }
  const baseUrl = getAuthBaseUrl(c);
  const supabase = createClient(baseUrl, serviceRoleKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (!error && data?.user?.id) {
    return data.user.id;
  }
  if (error) {
    console.warn("[visudev-auth] getUser failed", {
      message: error.message,
    });
  }
  throw new UnauthorizedException(
    "Session invalid or from another environment. Sign out and sign in again (use the same Supabase URL as this API).",
  );
}
