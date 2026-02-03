/**
 * Extracts Supabase user id from request Bearer JWT.
 * Tries Auth API first; for local dev (127.0.0.1/localhost) falls back to decoding JWT payload (sub) when API is unreachable.
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

function isLocalUrl(url: string): boolean {
  try {
    const u = new URL(url);
    const h = u.hostname.toLowerCase();
    return h === "127.0.0.1" || h === "localhost" || h === "host.docker.internal";
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

function getAuthBaseUrl(c: Context): string {
  const fromHeader = c.req.header("X-Supabase-URL");
  if (fromHeader && isAllowedSupabaseUrl(fromHeader)) {
    return urlReachableFromDocker(fromHeader.replace(/\/$/, ""));
  }
  const fromEnv = Deno.env.get("VISUDEV_PUBLIC_URL") ?? Deno.env.get("SUPABASE_URL");
  if (fromEnv) return urlReachableFromDocker(fromEnv.replace(/\/$/, ""));
  try {
    return urlReachableFromDocker(new URL(c.req.url).origin);
  } catch {
    throw new UnauthorizedException("Please sign in again");
  }
}

/** Local dev fallback: decode JWT payload and return sub (no signature check). Use only when Auth API is unreachable. */
function getSubFromJwtPayload(token: string): string | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(
      new TextDecoder().decode(
        Uint8Array.from(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")), (c) =>
          c.charCodeAt(0),
        ),
      ),
    );
    const sub = payload?.sub;
    return typeof sub === "string" && sub.length > 0 ? sub : null;
  } catch (e) {
    console.error("[visudev-auth] getSubFromJwtPayload failed", { message: String(e) });
    return null;
  }
}

export async function getAuthUserIdFromContext(
  c: Context,
  _supabase: unknown,
): Promise<string> {
  const authHeader = c.req.header("Authorization");
  const xSupabaseUrl = c.req.header("X-Supabase-URL");

  console.info("[visudev-auth] getAuthUserIdFromContext", {
    hasAuth: !!authHeader,
    authPrefix: authHeader?.slice(0, 10) ?? null,
    tokenLength: authHeader?.startsWith("Bearer ") ? authHeader.slice(7).trim().length : 0,
    xSupabaseUrl: xSupabaseUrl ?? null,
  });

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new UnauthorizedException("Please sign in first");
  }
  const token = authHeader.slice(7).trim();
  if (!token) {
    throw new UnauthorizedException("Please sign in first");
  }
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!serviceRoleKey) {
    console.error("[visudev-auth] SUPABASE_SERVICE_ROLE_KEY missing");
    throw new UnauthorizedException("Please sign in again");
  }
  const baseUrl = getAuthBaseUrl(c);
  const localUrl = isLocalUrl(baseUrl);

  console.info("[visudev-auth] auth env", {
    baseUrl,
    isLocalUrl: localUrl,
  });

  // For local URLs, try JWT payload decode first so we don't depend on Auth API reachable from Docker.
  if (localUrl) {
    const subFromPayload = getSubFromJwtPayload(token);
    if (subFromPayload) {
      console.info("[visudev-auth] local dev: using sub from JWT payload", { sub: subFromPayload });
      return subFromPayload;
    }
    console.warn("[visudev-auth] local dev: getSubFromJwtPayload returned null, trying getUser");
  }

  const supabase = createClient(baseUrl, serviceRoleKey);
  const { data, error } = await supabase.auth.getUser(token);
  if (!error && data?.user?.id) {
    return data.user.id;
  }
  if (error) {
    console.warn("[visudev-auth] getUser failed", { message: error.message, name: error.name });
  }
  if (localUrl) {
    const sub = getSubFromJwtPayload(token);
    if (sub) return sub;
  }
  console.error("[visudev-auth] 401: no user id", { hadGetUserError: !!error, localUrl });
  throw new UnauthorizedException(
    "Session invalid or from another environment. Sign out and sign in again (use the same Supabase URL as this API).",
  );
}
